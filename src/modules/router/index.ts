import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "index",
            component: () => import("../../page/Home.vue"),
        },
        {
            path: "/play/:uuid",
            name: "play",
            component: () => import("../../page/Play.vue"),
        },
        {
            path: "/settings",
            name: "settings",
            component: () => import("../../page/Settings.vue"),
        },
    ],
});

export default router;
