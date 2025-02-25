<script setup lang="ts">
	import {computed, onMounted, onUnmounted, ref, watch} from 'vue'

	const props = defineProps({
		thumbWidth: {
			type: Number,
			default: 10
		},
		trackWidth: {
			type: Number,
			default: 4
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
		durationHideMobile: {
			type: Number,
		},
		durationStepJump: {
			type: Number,
			default: 500
		}
	})

	// Tính toán offset khi thumb rộng hơn track
	const scrollbarOffset = computed(() => {
		if (props.thumbWidth > props.trackWidth) {
			return (props.thumbWidth - props.trackWidth) / 2;
		}
		return 0;
	});

	const scrollbarThumb = ref(null)
	const scrollbarTrack = ref(null)
	const container = ref(null)
	const isScrolling = ref(false)
	const isMouseHovering = ref(false)  // Trạng thái khi chuột hover
	const isDragging = ref(false);
	const startY = ref(0);
	const startScrollTop = ref(0);
	const isHoldingTrack = ref(false);
	const holdScrollInterval = ref(null);
	const currentStep = ref(0);
	const totalSteps = ref(0);
	let timeout = null;

	// Xác định nếu đang sử dụng touch
	const isTouchDevice = ref(false);

	// Lấy thời gian timeout phù hợp với loại thiết bị
	const getHideDuration = () => {
		const durationMobile = props.durationHideMobile ?? props.durationHide
		return isTouchDevice.value ? durationMobile : props.durationHide;
	};

	// Tính toán trạng thái hiển thị scrollbar
	const isScrollbarVisible = computed(() => {
		// Nếu đang sử dụng chuột và chuột đang hover -> hiển thị
		if (!isTouchDevice.value && isMouseHovering.value) return true;

		// Nếu đang scroll -> hiển thị
		return isScrolling.value;
	});

	const setUpHoverColor = (target, color) => {
		updateBackgroundColor(target, color);
	}

	const updateBackgroundColor = (target, color) => {
		target.style.backgroundColor = color;
	}

	const setupScrollbar = (options) => {
		if (container.value && scrollbarThumb.value && scrollbarTrack.value) {
			// Thiết lập style cho thumb và track
			scrollbarThumb.value.style.width = options.thumbWidth + "px";
			scrollbarThumb.value.style.backgroundColor = options.thumbColor;
			scrollbarTrack.value.style.width = options.trackWidth + "px";
			scrollbarTrack.value.style.backgroundColor = options.trackColor;

			// Cập nhật vị trí của scrollbar khi thumb rộng hơn track
			const offset = options.thumbWidth > options.trackWidth ?
				  (options.thumbWidth - options.trackWidth) / 2 : 0;
			scrollbarTrack.value.style.right = offset + "px";

			// Thiết lập event listeners cho hover color
			if (options.thumbHoverColor) {
				scrollbarThumb.value.addEventListener('mousemove', () => {
					if (isScrollbarVisible.value) {
						setUpHoverColor(scrollbarThumb.value, options.thumbHoverColor);
					}
				});
				scrollbarThumb.value.addEventListener('mouseout', () => {
					setUpHoverColor(scrollbarThumb.value, options.thumbColor);
				});
			}
			if (options.trackHoverColor) {
				scrollbarTrack.value.addEventListener('mousemove', () => {
					if (isScrollbarVisible.value) {
						setUpHoverColor(scrollbarTrack.value, options.trackHoverColor);
					}
				});
				scrollbarTrack.value.addEventListener('mouseout', () => {
					setUpHoverColor(scrollbarTrack.value, options.trackColor);
				});
			}
		}
	}

	const showScrollbar = () => {
		isScrolling.value = true
		if (timeout) clearTimeout(timeout)

		// Sử dụng thời gian ẩn tương ứng với loại thiết bị
		const duration = getHideDuration();


		timeout = setTimeout(() => {
			isScrolling.value = false
		}, duration)
	}

	// Xử lý hover vào scrollbar (chỉ cho chuột)
	const onScrollbarHover = () => {
		isMouseHovering.value = true;
	}

	// Xử lý khi di chuột ra khỏi scrollbar
	const onScrollbarLeave = () => {
		isMouseHovering.value = false;
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
		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible

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
			holdScrollInterval.value = setInterval(() => scrollOneStep(isScrollingDown, targetScroll.value), props.durationStepJump);
		}
	}

	const scrollOneStep = (isScrollingDown, targetScroll) => {
		if (!isScrollbarVisible.value) {
			clearInterval(holdScrollInterval.value);
			return;
		}

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
		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible

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

			if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible

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
		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible

		isDragging.value = true;
		startY.value = e.clientY;
		startScrollTop.value = container.value.scrollTop;
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	const onMouseMove = (e) => {
		if (!isDragging.value) return;
		if (!isScrollbarVisible.value) {
			isDragging.value = false;
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			return;
		}

		e.preventDefault();
		const deltaY = e.clientY - startY.value;
		const {clientHeight, scrollHeight} = container.value;

		const scrollRatio = scrollHeight / clientHeight;
		const newScrollTop = startScrollTop.value + (deltaY * scrollRatio);

		container.value.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight));
	}

	const onTrackMouseDown = (e) => {
		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible
		if (e.target === scrollbarThumb.value) return;

		isHoldingTrack.value = true;
		document.addEventListener('mousemove', onTrackMouseMove);

		const targetScrollTop = calculateScrollPosition(e.clientY);
		startStepScroll(targetScrollTop);
	}

	const onTrackMouseMove = (e) => {
		if (!isHoldingTrack.value) return;
		if (!isScrollbarVisible.value) {
			isHoldingTrack.value = false;
			document.removeEventListener('mousemove', onTrackMouseMove);
			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}
			return;
		}

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
		isTouchDevice.value = true; // Đánh dấu đang sử dụng touch

		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible

		e.preventDefault();
		const touch = e.touches[0];
		isTouching.value = true;
		startTouch.value = {x: touch.clientX, y: touch.clientY};
		lastTouch.value = {x: touch.clientX, y: touch.clientY};
		startScrollTop.value = container.value.scrollTop;
	}

	const onThumbTouchMove = (e) => {
		if (!isTouching.value) return;
		if (!isScrollbarVisible.value) {
			isTouching.value = false;
			return;
		}

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
		isTouchDevice.value = true; // Đánh dấu đang sử dụng touch

		if (!isScrollbarVisible.value) return; // Chỉ hoạt động khi scrollbar visible
		if (e.target === scrollbarThumb.value) return;

		const touch = e.touches[0];
		isHoldingTrack.value = true;
		const targetScrollTop = calculateScrollPosition(touch.clientY);
		startStepScroll(targetScrollTop);
	}

	const onTrackTouchMove = (e) => {
		if (!isHoldingTrack.value) return;
		if (!isScrollbarVisible.value) {
			isHoldingTrack.value = false;
			if (holdScrollInterval.value) {
				clearInterval(holdScrollInterval.value);
			}
			return;
		}

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

		// Đối với touch, vẫn sử dụng timeout bình thường
		// showScrollbar() đã được gọi trong các sự kiện scroll

		if (holdScrollInterval.value) {
			clearInterval(holdScrollInterval.value);
		}
	}

	// Phát hiện thiết bị touch khi tương tác với nội dung
	const onContentTouchStart = () => {
		isTouchDevice.value = true;
	}

	// Phát hiện thiết bị sử dụng chuột
	const onContentMouseMove = () => {
		isTouchDevice.value = false;
	}

	const addEventScrollbar = () => {
		if (container.value) {
			container.value.addEventListener('scroll', showScrollbar)
			container.value.addEventListener('scroll', updateScrollbarPosition)

			// Theo dõi loại thiết bị
			container.value.addEventListener('touchstart', onContentTouchStart)
			container.value.addEventListener('mousemove', onContentMouseMove)

			// Thêm event listener cho hover (chỉ có tác dụng với chuột)
			scrollbarTrack.value.addEventListener('mouseenter', onScrollbarHover)
			scrollbarTrack.value.addEventListener('mouseleave', onScrollbarLeave)

			scrollbarTrack.value.addEventListener('mousedown', onTrackMouseDown)
			scrollbarTrack.value.addEventListener('mouseleave', onTrackMouseLeave)
			scrollbarTrack.value.addEventListener('wheel', onTrackWheel)
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

			// Xóa event listener theo dõi thiết bị
			container.value.removeEventListener('touchstart', onContentTouchStart)
			container.value.removeEventListener('mousemove', onContentMouseMove)

			// Loại bỏ event listener cho hover
			scrollbarTrack.value.removeEventListener('mouseenter', onScrollbarHover)
			scrollbarTrack.value.removeEventListener('mouseleave', onScrollbarLeave)

			scrollbarTrack.value.removeEventListener('mousedown', onTrackMouseDown)
			scrollbarTrack.value.removeEventListener('mouseleave', onTrackMouseLeave)
			scrollbarTrack.value.removeEventListener('wheel', onTrackWheel)
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

	// Theo dõi thay đổi của props để cập nhật scrollbar
	watch(() => [props.thumbWidth, props.trackWidth], () => {
		if (scrollbarTrack.value) {
			const offset = props.thumbWidth > props.trackWidth ?
				  (props.thumbWidth - props.trackWidth) / 2 : 0;
			scrollbarTrack.value.style.right = offset + "px";
		}
	});

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
			  :class="{ 'scrollbar-visible': isScrollbarVisible }"
			  :style="{ right: scrollbarOffset + 'px' }"
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
		/* right định nghĩa động trong style binding ở template */
		width: 4px; /* Mặc định theo track width */
		height: 100%;
		opacity: 0;
		transition: opacity 0.3s ease, background-color 0.3s linear;
		user-select: none;
		touch-action: none;
		pointer-events: auto; /* Luôn nhận sự kiện để bắt được hover */
	}

	.scrollbar-visible {
		opacity: 1;
	}

	.scrollbar-thumb {
		user-select: none;
		position: absolute;
		top: 0;
		right: 50%;
		width: 10px; /* Mặc định theo thumb width */
		height: 100%;
		min-height: 30px;
		background-color: rgba(144, 144, 144, 0.7);
		border-radius: 4px;
		translate: 50% 0;
		touch-action: none;
		opacity: .8;
		transition: transform 0.025s ease, background-color 0.25s linear, opacity 0.25s linear;

		&:hover {
			opacity: 1
		}

		&.dragging {
			opacity: 1;
		}
	}
</style>
