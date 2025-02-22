<script setup lang="ts">
	import {ScrollbarContainer} from "@/components/ScrollbarContainer";
</script>

<template>
	<ScrollbarContainer :duration-hide="500" :thumb-width="6" :track-width="10" :spacing="24">
		<div class="about">
			<h1>This is an about page</h1>
		</div>
	</ScrollbarContainer>
</template>

<style scoped lang="scss">
	@media (min-width: 1024px) {
		.about {
			min-height: 2000dvh;
			display: flex;
			align-items: center;
		}
	}

	.about {
		background-color: rgba(255, 255, 255, .1);
		min-height: 2000dvh;

		h1 {
			margin-left: auto;
			color: red;
		}
	}
</style>
