<script setup>
	import {onMounted, onUnmounted, ref} from 'vue'

	const scrollbarThumb = ref(null)
	const scrollbarTrack = ref(null)
	const container = ref(null)
	const isScrolling = ref(false)
	const durationHide = ref(700);
	const isDragging = ref(false);
	const startY = ref(0);
	const startScrollTop = ref(0);
	let timeout = null

	const showScrollbar = () => {
		isScrolling.value = true
		if (timeout) clearTimeout(timeout)

		timeout = setTimeout(() => {
			isScrolling.value = false
		}, durationHide.value)
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
		const ratio = clientHeight / scrollHeight
		const thumbHeight = Math.max(clientHeight * ratio, 30)
		const availableSpace = clientHeight - thumbHeight - spacing
		const scrollRange = Math.floor(scrollHeight - clientHeight)
		const thumbPosition = ((scrollTop / scrollRange) * availableSpace) + (spacing / 2)

		scrollbarThumb.value.style.height = `${thumbHeight}px`
		scrollbarThumb.value.style.transform = `translateY(${thumbPosition}px)`
	}

	// Thêm các hàm xử lý drag & drop
	const onMouseDown = (e) => {
		isDragging.value = true;
		startY.value = e.clientY;
		startScrollTop.value = container.value.scrollTop;
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	const onMouseMove = (e) => {
		if (!isDragging.value) return;

		e.preventDefault();
		const deltaY = e.clientY - startY.value;
		const {clientHeight, scrollHeight} = container.value;

		// Tính tỷ lệ giữa khoảng cách di chuyển của chuột và khoảng cách scroll
		const scrollRatio = scrollHeight / clientHeight;
		const newScrollTop = startScrollTop.value + (deltaY * scrollRatio);

		// Cập nhật vị trí scroll
		container.value.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight));
	}

	const onMouseUp = () => {
		isDragging.value = false;
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}

	const addEventScrollbar = () => {
		if (container.value) {
			container.value.addEventListener('scroll', showScrollbar)
			container.value.addEventListener('scroll', updateScrollbarPosition)
			scrollbarTrack.value.addEventListener('mousemove', hoverScrollbarThumb)
			scrollbarTrack.value.addEventListener('mouseout', blurScrollbarThumb)
			scrollbarThumb.value.addEventListener('mousedown', onMouseDown)
			updateScrollbarPosition()
		}
	}

	const removeEventScrollbar = () => {
		if (container.value) {
			container.value.removeEventListener('scroll', showScrollbar)
			container.value.removeEventListener('scroll', updateScrollbarPosition)
			scrollbarTrack.value.removeEventListener('mousemove', hoverScrollbarThumb)
			scrollbarTrack.value.removeEventListener('mouseout', blurScrollbarThumb)
			scrollbarThumb.value.removeEventListener('mousedown', onMouseDown)
		}
		if (timeout) clearTimeout(timeout)
	}

	onMounted(() => {
		addEventScrollbar()
	})

	onUnmounted(() => {
		removeEventScrollbar()
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
				  :class="{ 'dragging': isDragging }"
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

	.content::-webkit-scrollbar {
		display: none;
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
		transition: transform 0.05s ease;
		translate: 50% 0;
		cursor: pointer;

		&:hover {
			background-color: rgba(144, 144, 144, 0.9);
		}

		&.dragging {
			background-color: rgba(144, 144, 144, 1);
			width: 8px;
		}
	}
</style>
