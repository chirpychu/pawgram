// Checks a newly-created post for whether it's actually pet/animal-related.
// Triggered asynchronously (via pg_net) right after the post's media row is
// inserted, so the post is already live by the time this runs — if it's
// rejected, the post + its image/video + its post_images row are deleted,
// and the author gets a notification explaining why.
//
// Deliberately "fails open": any error talking to the model, a missing API
// key, an unparseable response, etc. leaves the post untouched rather than
// risking deleting a legitimate post due to a transient problem.
//
// Scope note: only image posts are classified for now. Feeding full video
// to a vision model cheaply isn't practical here, so video posts are
// skipped (always allowed) — see the note sent back to the user about this.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const MODEL = 'claude-haiku-5-5'
const POST_IMAGES_BUCKET = 'post-images'

function extToMime(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    case 'gif': return 'image/gif'
    default: return 'image/jpeg'
  }
}

Deno.serve(async (req) => {
  try {
    const { post_id } = await req.json()
    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id required' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id, author_id, caption')
      .eq('id', post_id)
      .maybeSingle()

    if (postErr || !post) {
      // Post may already have been deleted (e.g. by the author) — nothing to do.
      return new Response(JSON.stringify({ skipped: 'post_not_found' }), { status: 200 })
    }

    const { data: images, error: imagesErr } = await supabase
      .from('post_images')
      .select('id, storage_path, media_type')
      .eq('post_id', post_id)
      .order('position', { ascending: true })

    if (imagesErr || !images || images.length === 0) {
      return new Response(JSON.stringify({ skipped: 'no_media' }), { status: 200 })
    }

    const first = images[0]

    if (first.media_type === 'video') {
      // Not classified in this version — see file header note.
      return new Response(JSON.stringify({ skipped: 'video_not_classified' }), { status: 200 })
    }

    if (!ANTHROPIC_API_KEY) {
      // No key configured yet — fail open, don't block/delete anything.
      return new Response(JSON.stringify({ skipped: 'no_api_key' }), { status: 200 })
    }

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .download(first.storage_path)

    if (downloadErr || !fileData) {
      return new Response(JSON.stringify({ skipped: 'image_download_failed' }), { status: 200 })
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer())
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)
    const mediaType = extToMime(first.storage_path)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              {
                type: 'text',
                text:
                  `This is a photo from a pet-social-media app called Pawgram, where every post is supposed to be about a pet or animal. ` +
                  `Caption: "${(post.caption || '').slice(0, 500)}"\n\n` +
                  `Does this image clearly show a pet, companion animal, or wild animal (dog, cat, bird, rabbit, reptile, fish, farm animal, etc.), ` +
                  `or is the caption clearly about a pet/animal even if not the main visual subject? ` +
                  `Answer with exactly one word: YES or NO.`,
              },
            ],
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      // API error — fail open.
      return new Response(JSON.stringify({ skipped: 'anthropic_api_error', status: anthropicRes.status }), { status: 200 })
    }

    const anthropicJson: any = await anthropicRes.json()
    const verdictText = (anthropicJson?.content?.[0]?.text || '').trim().toUpperCase()

    if (!verdictText.startsWith('NO')) {
      // YES, or anything unparseable/ambiguous — allow the post to stand.
      return new Response(JSON.stringify({ allowed: true, verdict: verdictText }), { status: 200 })
    }

    // Rejected: remove the post's media file(s), the post itself (cascades
    // post_images/likes/comments/notifications-by-post_id), and notify the author.
    const storagePaths = images.map((img) => img.storage_path).filter(Boolean)
    if (storagePaths.length > 0) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(storagePaths)
    }

    await supabase.from('posts').delete().eq('id', post_id)

    await supabase.from('notifications').insert({
      recipient_id: post.author_id,
      actor_id: null,
      type: 'post_removed',
      message: "Your post was removed because it didn't appear to be about a pet or animal. Pawgram is for pet content only — feel free to post again with a pet-related photo and caption.",
    })

    return new Response(JSON.stringify({ removed: true }), { status: 200 })
  } catch (err) {
    // Any unexpected failure fails open rather than risking a wrongful delete.
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 })
  }
})
