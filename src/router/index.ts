import {createRouter, createWebHistory} from 'vue-router'
import {pathNames} from "@/constant/pathNames.ts";

const importView = (viewName: string): Promise<any> =>
	import(/* webpackChunkName: "[request]" */ `@/views/${viewName}/index.ts`)


const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: pathNames.home,
			name: 'home-view',
			component: () => importView('HomeView'),
		},
		{
			path: pathNames.about,
			name: 'about-view',
			component: () => importView('AboutView'),
		},
		{
			path: pathNames.notFound,
			name: 'not-found',
			component: () => importView('NotFound'),
		},
		{
			path: pathNames.pathError,
			redirect: pathNames.notFound
		},
	],
})

export default router
