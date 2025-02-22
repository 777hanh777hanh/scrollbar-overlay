<script setup lang="ts">
	import {ScrollbarContainer} from "@/components/ScrollbarContainer";
</script>

<template>
	<ScrollbarContainer>
		<div class="about">
			<h1>This is an about page</h1>
		</div>
	</ScrollbarContainer>
</template>

<style scoped lang="scss">
	@media (min-width: 1024px) {
		.about {
			min-height: 500dvh;
			display: flex;
			align-items: center;
		}
	}

	.about {
		background-color: rgba(255, 255, 255, .1);
	}
</style>
