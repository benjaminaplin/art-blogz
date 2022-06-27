import type { Post } from '@prisma/client'
import { prisma } from '~/db.server'

export async function getPosts() {
    return prisma.post.findMany()
}

export async function getPost(slug: string) {
    return prisma.post.findUnique({where: {slug}})
}

export async function getPostListings() {
    return prisma.post.findMany({
        select:{
            slug: true, title: true, user: true
        }
    })
}

export async function createPost(post: Pick<Post, 'slug' | 'title' | 'markdown' | 'userId'>){
    return prisma.post.create({data:post})
}
export async function update(slug: string, post: Pick<Post, 'slug' | 'title' | 'markdown' | 'userId'>){
    return prisma.post.update({data:post, where: {slug}})
}
export async function deletePost(slug: string){
    return prisma.post.delete({where: {slug}})
}