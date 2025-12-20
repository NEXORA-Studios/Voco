<template>
    <div class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content text-neutral-content text-center">
            <div class="max-w-md">
                <h1 class="mb-5 text-5xl font-bold">Unknown Space</h1>
                <p class="mb-5">The space you are trying to access does not exist.</p>
                <button class="btn btn-primary" @click="$router.push('/')">Go Home</button>
            </div>
        </div>
    </div>
</template>
