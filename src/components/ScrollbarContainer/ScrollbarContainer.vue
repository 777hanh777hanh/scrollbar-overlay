<script setup lang="ts">
	import {onMounted, onUnmounted, ref} from 'vue'

	const props = defineProps({
		thumbWidth: {
			type: Number,
			default: 4
		},
		trackWidth: {
			type: Number,
			default: 10
		},
		thumbColor: {
			type: String,
			default: '#333'
		},
		thumbHoverColor: {
			type: String,
			default: ''
		},
		trackColor: {
			type: String,
			default: 'rgba(0, 0, 0, 0.1)'
		},
		trackHoverColor: {
			type: String,
			default: ''
		},
		spacing: {
			type: Number,
			default: 4
		},
		durationHide: {
			type: Number,
			default: 700
		},
		durationStepJump: {
			type: Number,
			default: 500
		}
	})

	const durationHide = ref(700);
	const durationStepJump = ref(500);
	const scrollbarThumb = ref(null)
	const scrollbarTrack = ref(null)
	const container = ref(null)
	const isScrolling = ref(false)
	const isDragging = ref(false);
	const startY = ref(0);
	const startScrollTop = ref(0);
	const isHoldingTrack = ref(false);
	const holdScrollInterval = ref(null);
	const currentStep = ref(0);
	const totalSteps = ref(0);
	let timeout: null = null;


	const setUpHoverColor = (target, color) => {
		updateBackgroundColor(target, color);
	}

	const updateBackgroundColor = (target, color) => {
		target.style.backgroundColor = color;
	}

	const setupScrollbar = (options) => {
		durationHide.value = options.durationHide || 700;
		durationStepJump.value = options.durationStepJump || 500;

		if (container.value && scrollbarThumb.value) {
			scrollbarThumb.value.style.width = options.thumbWidth + "px";
			scrollbarThumb.value.style.backgroundColor = options.thumbColor;
			scrollbarTrack.value.style.width = options.trackWidth + "px";
			scrollbarTrack.value.style.backgroundColor = options.trackColor;

			// Correct event listener setup
			if (options.thumbHoverColor) {
				scrollbarThumb.value.addEventListener('mousemove', () => setUpHoverColor(scrollbarThumb.value, options.thumbHoverColor));
				scrollbarTrack.value.addEventListener('mouseout', () => setUpHoverColor(scrollbarTrack.value, options.trackColor));
			}
			if (options.trackHoverColor) {
				scrollbarTrack.value.addEventListener('mousemove', () => setUpHoverColor(scrollbarTrack.value, options.trackHoverColor));
				scrollbarThumb.value.addEventListener('mouseout', () => setUpHoverColor(scrollbarThumb.value, options.thumbColor));
			}
		}
	}


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

	const startStepScroll = (targetScrollTop) => {
		if (holdScrollInterval.value) {
			clearInterval(holdScrollInterval.value);
		}

		const {clientHeight, scrollTop: currentScrollTop} = container.value;

		// Lưu target scrollTop để dùng trong scrollOneStep
		const targetScroll = ref(targetScrollTop);

		totalSteps.value = Math.ceil(Math.abs(targetScrollTop - currentScrollTop) / clientHeight);
		currentStep.value = 0;

		const isScrollingDown = targetScrollTop > currentScrollTop;

		scrollOneStep(isScrollingDown, targetScroll.value);

		if (isHoldingTrack.value && currentStep.value < totalSteps.value) {
			holdScrollInterval.value = setInterval(() => scrollOneStep(isScrollingDown, targetScroll.value), durationStepJump.value);
		}
	}

	const scrollOneStep = (isScrollingDown, targetScroll) => {
		const {clientHeight, scrollHeight, scrollTop} = container.value;

		if (!isHoldingTrack.value) {
			clearInterval(holdScrollInterval.value);
			return;
		}

		// Tính remaining scroll và điều kiện dừng dựa vào hướng scroll
		const remainingScroll = isScrollingDown ? targetScroll - scrollTop : scrollTop - targetScroll;
		if (remainingScroll <= 0) {
			clearInterval(holdScrollInterval.value);
			return;
		}

		// Tính scroll amount và cập nhật scrollTop
		const scrollAmount = Math.min(clientHeight, remainingScroll);
		container.value.scrollTop += isScrollingDown ? scrollAmount : -scrollAmount;

		currentStep.value++;

		// Kiểm tra điều kiện dừng
		const reachedLimit = isScrollingDown
			  ? container.value.scrollTop >= scrollHeight - clientHeight
			  : container.value.scrollTop <= 0;

		if (currentStep.value >= totalSteps.value || reachedLimit) {
			clearInterval(holdScrollInterval.value);
		}
	}


	const onTrackMouseLeave = () => {
		if (isHoldingTrack.value && holdScrollInterval.value) {
			clearInterval(holdScrollInterval.value);
		}
	}

	// Thêm xử lý scroll wheel trong track
	const onTrackWheel = (e) => {
		e.preventDefault();
		const {clientHeight, scrollHeight, scrollTop} = container.value;
		const maxScroll = scrollHeight - clientHeight;

		// Điều chỉnh độ nhạy của scroll (có thể thay đổi hệ số 0.5 để tăng/giảm tốc độ)
		const delta = e.deltaY * 0.5;
		container.value.scrollTop = Math.max(0, Math.min(scrollTop + delta, maxScroll));
		showScrollbar();
	}

	const onTrackMouseUp = (e) => {
		if (isHoldingTrack.value) {
			isHoldingTrack.value = false;
			document.removeEventListener('mousemove', onTrackMouseMove);

			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}

			const {left, right, top, bottom} = scrollbarTrack.value.getBoundingClientRect();
			if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
				container.value.scrollTop = calculateScrollPosition(e.clientY);
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

		const ratio = clientHeight / scrollHeight
		const thumbHeight = Math.max(clientHeight * ratio, 30)
		const availableSpace = clientHeight - thumbHeight - (props.spacing * 2)
		const scrollRange = Math.floor(scrollHeight - clientHeight)
		const thumbPosition = ((scrollTop / scrollRange) * availableSpace) + (props.spacing)

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

	const onTrackMouseDown = (e) => {
		if (e.target === scrollbarThumb.value) return;

		isHoldingTrack.value = true;
		document.addEventListener('mousemove', onTrackMouseMove);

		const targetScrollTop = calculateScrollPosition(e.clientY);
		startStepScroll(targetScrollTop);
	}

	const onTrackMouseMove = (e) => {
		if (!isHoldingTrack.value) return;

		const {left, right, top, bottom} = scrollbarTrack.value.getBoundingClientRect();
		const clientX = e.clientX;
		const clientY = e.clientY;
		const isInTrack = clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;

		if (!isInTrack) {
			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}
			return;
		}

		// Lấy vị trí hiện tại của thumb
		const thumbRect = scrollbarThumb.value.getBoundingClientRect();
		const thumbMiddle = thumbRect.top + thumbRect.height / 2;

		// Nếu chuột ở gần thumb (trong khoảng 10px) thì chuyển sang drag mode
		if (Math.abs(clientY - thumbMiddle) <= 10) {
			clearInterval(holdScrollInterval.value);
			isHoldingTrack.value = false;

			// Chuyển sang drag mode
			isDragging.value = true;
			startY.value = clientY;
			startScrollTop.value = container.value.scrollTop;
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		} else {
			// Nếu không, tiếp tục scroll theo step đến vị trí mới
			const targetScrollTop = calculateScrollPosition(clientY);
			startStepScroll(targetScrollTop);
		}
	}

	const onMouseUp = () => {
		isDragging.value = false;
		isHoldingTrack.value = false;

		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}

	// Thêm các ref mới để theo dõi trạng thái touch
	const isTouching = ref(false);
	const startTouch = ref({x: 0, y: 0});
	const lastTouch = ref({x: 0, y: 0});

	// Thêm các hàm xử lý touch events
	const onThumbTouchStart = (e) => {
		e.preventDefault();
		const touch = e.touches[0];
		isTouching.value = true;
		startTouch.value = {x: touch.clientX, y: touch.clientY};
		lastTouch.value = {x: touch.clientX, y: touch.clientY};
		startScrollTop.value = container.value.scrollTop;
	}

	const onThumbTouchMove = (e) => {
		if (!isTouching.value) return;
		e.preventDefault();

		const touch = e.touches[0];
		const deltaY = touch.clientY - startTouch.value.y;
		lastTouch.value = {x: touch.clientX, y: touch.clientY};

		const {clientHeight, scrollHeight} = container.value;
		const scrollRatio = scrollHeight / clientHeight;
		const newScrollTop = startScrollTop.value + (deltaY * scrollRatio);

		container.value.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight));
	}

	const onTrackTouchStart = (e) => {
		if (e.target === scrollbarThumb.value) return;

		const touch = e.touches[0];
		isHoldingTrack.value = true;
		const targetScrollTop = calculateScrollPosition(touch.clientY);
		startStepScroll(targetScrollTop);
	}

	const onTrackTouchMove = (e) => {
		if (!isHoldingTrack.value) return;
		e.preventDefault();

		const touch = e.touches[0];
		const {left, right, top, bottom} = scrollbarTrack.value.getBoundingClientRect();
		const isInTrack = touch.clientX >= left && touch.clientX <= right &&
			  touch.clientY >= top && touch.clientY <= bottom;

		if (!isInTrack) {
			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}
			return;
		}

		const thumbRect = scrollbarThumb.value.getBoundingClientRect();
		const thumbMiddle = thumbRect.top + thumbRect.height / 2;

		if (Math.abs(touch.clientY - thumbMiddle) <= 10) {
			clearInterval(holdScrollInterval.value);
			isHoldingTrack.value = false;

			// Chuyển sang touch drag mode
			isTouching.value = true;
			startTouch.value = {x: touch.clientX, y: touch.clientY};
			lastTouch.value = {x: touch.clientX, y: touch.clientY};
			startScrollTop.value = container.value.scrollTop;
		} else {
			const targetScrollTop = calculateScrollPosition(touch.clientY);
			startStepScroll(targetScrollTop);
		}
	}

	const onTouchEnd = () => {
		isTouching.value = false;
		isHoldingTrack.value = false;
		if (holdScrollInterval.value) {
			clearInterval(holdScrollInterval.value);
		}
	}


	const addEventScrollbar = () => {
		if (container.value) {
			container.value.addEventListener('scroll', showScrollbar)
			container.value.addEventListener('scroll', updateScrollbarPosition)
			scrollbarTrack.value.addEventListener('mousemove', hoverScrollbarThumb)
			scrollbarTrack.value.addEventListener('mouseout', blurScrollbarThumb)
			scrollbarTrack.value.addEventListener('mousedown', onTrackMouseDown)
			scrollbarTrack.value.addEventListener('mouseleave', onTrackMouseLeave)
			scrollbarTrack.value.addEventListener('wheel', onTrackWheel) // Thêm event wheel
			document.addEventListener('mouseup', onTrackMouseUp)
			scrollbarThumb.value.addEventListener('mousedown', onMouseDown)

			// Add touch events
			scrollbarThumb.value.addEventListener('touchstart', onThumbTouchStart, {passive: false});
			scrollbarThumb.value.addEventListener('touchmove', onThumbTouchMove, {passive: false});
			scrollbarTrack.value.addEventListener('touchstart', onTrackTouchStart, {passive: false});
			scrollbarTrack.value.addEventListener('touchmove', onTrackTouchMove, {passive: false});
			document.addEventListener('touchend', onTouchEnd);

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
			scrollbarTrack.value.removeEventListener('mouseleave', onTrackMouseLeave)
			scrollbarTrack.value.removeEventListener('wheel', onTrackWheel) // Remove event wheel
			document.removeEventListener('mouseup', onTrackMouseUp)
			document.removeEventListener('mousemove', onTrackMouseMove)
			scrollbarThumb.value.removeEventListener('mousedown', onMouseDown)

			// Remove touch events
			scrollbarThumb.value.removeEventListener('touchstart', onThumbTouchStart);
			scrollbarThumb.value.removeEventListener('touchmove', onThumbTouchMove);
			scrollbarTrack.value.removeEventListener('touchstart', onTrackTouchStart);
			scrollbarTrack.value.removeEventListener('touchmove', onTrackTouchMove);
			document.removeEventListener('touchend', onTouchEnd);
		}
		if (timeout) clearTimeout(timeout)
		if (holdScrollInterval.value) clearInterval(holdScrollInterval.value)
	}

	onMounted(() => {
		setupScrollbar(props)
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
		overscroll-behavior: none;
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
		overscroll-behavior: none;
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
		transition: opacity 0.3s ease, background-color 0.3s linear;
		cursor: pointer;
		user-select: none;
		touch-action: none;
	}

	.scrollbar-visible {
		opacity: 1;
	}

	.scrollbar-thumb {
		user-select: none;
		position: absolute;
		top: 0;
		right: 50%;
		width: 6px;
		height: 100%;
		min-height: 30px;
		background-color: rgba(144, 144, 144, 0.7);
		border-radius: 4px;
		transition: transform 0.025s ease, background-color 0.25s linear;
		translate: 50% 0;
		cursor: pointer;
		touch-action: none;

		&:hover {
			opacity: 1
		}

		&.dragging {
			opacity: 1;
		}
	}

</style>
