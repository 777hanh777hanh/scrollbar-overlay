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
	const isHoldingTrack = ref(false);
	const holdScrollInterval = ref(null);
	let timeout = null;

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

	const calculateScrollPosition = (clientY) => {
		const {top: trackTop} = scrollbarTrack.value.getBoundingClientRect();
		const {clientHeight, scrollHeight} = container.value;
		const thumbHeight = Math.max(clientHeight * (clientHeight / scrollHeight), 30);
		const availableSpace = clientHeight - thumbHeight;

		const relativeClickPosition = clientY - trackTop;
		const adjustedPosition = Math.max(0, Math.min(relativeClickPosition - thumbHeight / 2, availableSpace));

		const scrollRatio = (scrollHeight - clientHeight) / availableSpace;
		return Math.max(0, Math.min(adjustedPosition * scrollRatio, scrollHeight - clientHeight));
	}

	const startAutoScroll = (clientY) => {
		const newScrollTop = calculateScrollPosition(clientY);
		container.value.scrollTop = newScrollTop;

		if (isHoldingTrack.value) {
			const {clientHeight, scrollHeight} = container.value;
			const remainingScroll = scrollHeight - newScrollTop - clientHeight;
			const steps = Math.floor(remainingScroll / clientHeight);

			let currentStep = 0;

			holdScrollInterval.value = setInterval(() => {
				if (currentStep < steps && isHoldingTrack.value) {
					container.value.scrollTop += clientHeight;
					currentStep++;
				} else {
					clearInterval(holdScrollInterval.value);
				}
			}, 500);
		}
	}

	const onTrackMouseDown = (e) => {
		if (e.target === scrollbarThumb.value) return;

		isHoldingTrack.value = true;
		// Thêm event listener cho mousemove khi bắt đầu giữ track
		document.addEventListener('mousemove', onTrackMouseMove);
		startAutoScroll(e.clientY);
	}

	// Thêm hàm xử lý mousemove khi đang giữ track
	const onTrackMouseMove = (e) => {
		if (isHoldingTrack.value) {
			// Clear interval đang chạy nếu có
			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}
			// Cập nhật vị trí scroll theo vị trí chuột mới
			const newScrollTop = calculateScrollPosition(e.clientY);
			container.value.scrollTop = newScrollTop;
		}
	}

	const onTrackMouseUp = (e) => {
		if (isHoldingTrack.value) {
			isHoldingTrack.value = false;
			// Remove event listener mousemove khi thả track
			document.removeEventListener('mousemove', onTrackMouseMove);

			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}

			const {left, right, top, bottom} = scrollbarTrack.value.getBoundingClientRect();
			if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
				startAutoScroll(e.clientY);
			}
		}
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

		const scrollRatio = scrollHeight / clientHeight;
		const newScrollTop = startScrollTop.value + (deltaY * scrollRatio);

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
			scrollbarTrack.value.addEventListener('mousedown', onTrackMouseDown)
			document.addEventListener('mouseup', onTrackMouseUp)
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
			scrollbarTrack.value.removeEventListener('mousedown', onTrackMouseDown)
			document.removeEventListener('mouseup', onTrackMouseUp)
			document.removeEventListener('mousemove', onTrackMouseMove)
			scrollbarThumb.value.removeEventListener('mousedown', onMouseDown)
		}
		if (timeout) clearTimeout(timeout)
		if (holdScrollInterval.value) clearInterval(holdScrollInterval.value)
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
		cursor: pointer;
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
