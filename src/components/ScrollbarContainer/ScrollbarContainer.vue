<script setup>
	import {onMounted, onUnmounted, ref} from 'vue'

	const scrollbarThumb = ref(null)
	const scrollbarTrack = ref(null)
	const container = ref(null)
	const isScrolling = ref(false)
	let timeout = null

	const showScrollbar = () => {
		isScrolling.value = true
		if (timeout) clearTimeout(timeout)

		timeout = setTimeout(() => {
			isScrolling.value = false
		}, 700)
	}

	const hoverScrollbarThumb = () => {
		if (timeout) clearTimeout(timeout)
		isScrolling.value = true;
	}
	const blurScrollbarThumb = () => {
		showScrollbar()
	}

	const updateScrollbarPosition = () => {
		if (!container.value || !scrollbarThumb.value) return

		const {
			clientHeight,
			scrollHeight,
			scrollTop
		} = container.value

		const spacing = 4;
		// Tính tỷ lệ giữa clientHeight và scrollHeight
		const ratio = clientHeight / scrollHeight
		// Chiều cao của thumb
		const thumbHeight = Math.max(clientHeight * ratio, 30)
		// Khoảng trống để thumb có thể di chuyển
		const availableSpace = clientHeight - thumbHeight - spacing
		// Khoảng có thể scroll
		const scrollRange = Math.floor(scrollHeight - clientHeight)
		// Tính vị trí thumb
		const thumbPosition = ((scrollTop / scrollRange) * availableSpace) + (spacing / 2)


		// Cập nhật style cho thumb
		scrollbarThumb.value.style.height = `${thumbHeight}px`
		scrollbarThumb.value.style.transform = `translateY(${thumbPosition}px)`
	}

	onMounted(() => {
		if (container.value) {
			container.value.addEventListener('scroll', showScrollbar)
			container.value.addEventListener('scroll', updateScrollbarPosition)
			scrollbarTrack.value.addEventListener('mousemove', hoverScrollbarThumb)
			scrollbarTrack.value.addEventListener('mouseout', blurScrollbarThumb)
			updateScrollbarPosition()
		}
	})

	onUnmounted(() => {
		if (container.value) {
			container.value.removeEventListener('scroll', showScrollbar)
			container.value.removeEventListener('scroll', updateScrollbarPosition)
			scrollbarTrack.value.addEventListener('mousemove', hoverScrollbarThumb)
			scrollbarTrack.value.addEventListener('mouseout', blurScrollbarThumb)
		}
		if (timeout) clearTimeout(timeout)
	})
</script>

<template>
	<div class="scroll-container">
		<div class="content" ref="container">
			<slot></slot>
		</div>

		<div
			  ref="scrollbarTrack"
			  class="custom-scrollbar"
			  :class="{ 'scrollbar-visible': isScrolling }"
		>
			<div
				  class="scrollbar-thumb"
				  ref="scrollbarThumb"
			></div>
		</div>
	</div>
</template>

<style scoped lang="scss">
	.scroll-container {
		position: relative;
		height: 100%;
		overflow-y: hidden;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scroll-container::-webkit-scrollbar {
		display: none;
	}

	.content {
		position: relative;
		overflow: scroll;
		width: 100%;
		height: 100%;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.custom-scrollbar {
		background-color: rgba(0, 0, 0, 0.1);
		position: absolute;
		top: 0;
		right: 0;
		width: 20px;
		height: 100%;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.scrollbar-visible {
		opacity: 1;
	}

	.scrollbar-thumb {
		position: absolute;
		top: 0;
		right: 50%;
		width: 6px;
		height: 100%;
		min-height: 30px;
		background-color: rgba(144, 144, 144, 0.7);
		border-radius: 4px;
		transition: transform 0.1s ease;
		translate: 50% 0;
	}

</style>
