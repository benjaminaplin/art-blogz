import { Form, useActionData, useCatch, useLoaderData, useParams, useTransition,  } from "@remix-run/react"
import type { ActionFunction, LoaderFunction} from '@remix-run/node';
import { json} from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { createPost, deletePost, getPost, update } from "~/models/post.server";
import invariant from "tiny-invariant";
import { requireAdminUser } from "~/session.server";
import type { Post } from "@prisma/client"

export type { Post }
type LoaderData = { post?: Post }

export const loader: LoaderFunction = async ({request, params}) => {
    invariant(typeof params.slug === "string", "this must be string")
    await requireAdminUser(request)
    if(params.slug === 'new'){
        return json<LoaderData>({})
    }
    const post = await getPost(params.slug)
    if(!post){
        throw new Response('Not Found', {status: 404})
    }
    return json<LoaderData>({post: post})
}

const inputClassName = `w-full rounded border border-gray-500 px-2 py1 text-lg`
type ActionData = {
    title: string | null, 
    slug: string | null,
    markdown: string | null,
    userId: string | null
} | undefined



export const action: ActionFunction = async ({request, params})=> {
    await requireAdminUser(request)

   const formData = await request.formData()
   const intent = formData.get('intent')
   if(intent === 'delete'){
    invariant(typeof params.slug === "string", "this must be string")
    await deletePost(params.slug)
    return redirect('/posts/admin')
   }
   const title = formData.get('title')
   const slug = formData.get('slug')
   const markdown = formData.get('markdown')
   const userId = formData.get('userId')

   const errors: ActionData = {
    title: title ? null : 'you need a title bro',
    slug: slug ? null : 'you need a slug bro',
    markdown: markdown ? null : 'you need a markdown bro',
    userId: userId ? null : 'you need a userId bro'
   }
   const hasErrors = Object.values(errors).some(errorMessage => errorMessage)
   if(hasErrors){
    return json<ActionData>(errors)
   }
   invariant(typeof title === "string", "this must be string")
   invariant(typeof slug === "string", "this must be string")
   invariant(typeof markdown === "string", "this must be string")
   invariant(typeof userId === "string", "this must be string")
   if(params.slug === 'new'){
    await createPost({title, slug, markdown, userId})
} else {
    invariant(typeof params.slug === "string", "this must be string")
    await update(params.slug, { title, slug, markdown, userId})
}
   return redirect('/posts/admin')
}

export default  function NewPostRoute() {
    const errors = useActionData() as ActionData
    const transition = useTransition()
    const data = useLoaderData()
    const intent = transition.submission?.formData.get("intent")

    const isCreating = intent === "create"
    const isUpdating = intent === "update"
    const isDeleting = intent === "delete"

    const makeErrors = (name: 'title' | 'slug' | 'markdown' | 'userId') => (
        errors?.[name] ? (<em className="text-red-600">{errors[name]}</em> ): null
    )
    const isNewPost =  !data.post?.slug
    return (
        <Form method="post" key={data.post?.slug ?? 'new' }>
            <p>
                <label>Post Title: {makeErrors('title')}
                    <input type="text" name="title" className={inputClassName} defaultValue={data.post?.title}/>
                </label>
            </p>
            <p>
                <label>Post Slug: {makeErrors('slug')}
                    <input type="text" name="slug" className={inputClassName} defaultValue={data.post?.slug} />
                </label>
            </p>
            <p>
                <label htmlFor="markdown">Markdown:  {makeErrors('markdown')}</label>
                <textarea id="markdown" rows={20} name="markdown" className={`${inputClassName} font-mono`}  defaultValue={data.post?.markdown}/>
            </p>
            <p>
                <input readOnly={true} hidden value="cl4srpbr70006qcc1ywej1m5k" className={inputClassName} name="userId"  defaultValue={data.post?.userId}/>
                    </p>
            <div className="flex justify-end gap-4">
                {isNewPost
                    ? null
                    : <button
                        type="submit"
                        name="intent"
                        value="delete"
                        className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600"
                        disabled={isDeleting}
                        >
                            {isDeleting ?  "Deleting..." :  "Delete Post"  }
                        </button>
                }
                <button
                    type="submit"
                    name="intent"
                    value={isNewPost ? "create" : "update"}
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600"
                    disabled={isCreating}>
                    {isUpdating ? "Updating..." : "Update Post"}
                    {isCreating ? "Creating..." : "Create Post" }
                </button>
            </div>
        </Form>
    )
}

export function CatchBoundary(){
    const caught = useCatch()
    const params = useParams()
    if(caught.status === 404){
        return <div>{`Uh oh! ${params} does not exist!`}</div>
    }
    throw new Error(`Unsupported thrown response status code: ${caught.status}`)    
}

export function ErrorBoundary({error} : {error: unknown}){
    if(error instanceof Error){
        return <div className="text-red-500">
            Oh no, something went wrong!
            <pre>{error.message}</pre>
        </div>
    }
    <div className="text-red-500">
        Oh no, something went wrong!
    </div>
}