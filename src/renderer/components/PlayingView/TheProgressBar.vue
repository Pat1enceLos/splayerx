<template>
  <div
    v-fade-in="showAllWidgets || progressTriggerStopped"
    class="the-progress-bar"
    @mousemove="handleMousemove"
    @mouseenter="hoveredmouseenter"
    @mouseleave="handleMouseleave"
    @mousedown.stop="handleMousedown"
  >
    <the-preview-thumbnail
      v-show="showThumbnail"
      class="the-preview-thumbnail"
      :current-time="hoveredCurrentTime"
      :video-time="convertedHoveredCurrentTime"
      :thumbnail-width="thumbnailWidth"
      :thumbnail-height="thumbnailHeight"
      :position-of-thumbnail="thumbnailPosition"
      :hovered-end="hoveredPercent === 100 && !!nextVideo"
    />
    <div
      ref="leftInvisible"
      class="fake-button left"
      :style="{ height: fakeButtonHeight }"
    >
      <div
        class="fake-progress"
        :style="{
          height: hovering ? '10px' : '4px',
          backgroundColor: leftFakeProgressBackgroundColor,
        }"
      >
        <div
          v-if="hoveredCurrentTime === 0 && hovering"
          class="radius"
          :style="{
            width: '20px',
            height: '10px',
            borderTopRightRadius: '20px',
            borderBottomRightRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            transition: 'background-color 150ms, height 150ms',
          }"
        />
      </div>
    </div>
    <div
      class="progress"
      :style="{ height: hovering ? '10px' : '4px' }"
    >
      <div
        ref="hoveredProgress"
        class="hovered"
      />
      <div
        ref="playedProgress"
        class="played"
      />
      <div
        ref="defaultProgress"
        class="default"
        :style="{ order: '2' }"
      />
    </div>
    <div
      ref="rightInvisible"
      class="fake-button right"
      :style="{ height: fakeButtonHeight }"
    >
      <div
        ref="fakeProgress"
        class="fake-progress"
        :style="{
          height: hovering ? '10px' : '4px',
          backgroundColor: rightFakeProgressBackgroundColor,
        }"
      />
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { videodata } from '@/store/video';
import { INPUT_COMPONENT_TYPE } from '@/plugins/input';
import ThePreviewThumbnail from '@/containers/ThePreviewThumbnail.vue';

export default {
  name: 'TheProgressBar',
  type: INPUT_COMPONENT_TYPE,
  components: {
    'the-preview-thumbnail': ThePreviewThumbnail,
  },
  props: {
    showAllWidgets: Boolean,
  },
  data() {
    return {
      hoveredPageX: 0,
      showThumbnail: false,
      mousedown: false,
      mouseleave: true,
      hovering: false,
      hoveringId: 0,
      progressTriggerStopped: false,
      progressTriggerId: 0,
      progressDisappearDelay: 1000,
    };
  },
  computed: {
    ...mapGetters(['winWidth', 'winHeight', 'winRatio', 'duration', 'ratio', 'nextVideo']),
    hoveredPercent() {
      return this.hovering ? this.pageXToProportion(this.hoveredPageX, 20, this.winWidth) * 100 : 0;
    },
    hoveredCurrentTime() {
      return this.duration * this.pageXToProportion(this.hoveredPageX, 20, this.winWidth);
    },
    convertedHoveredCurrentTime() {
      return this.timecodeFromSeconds(this.hoveredCurrentTime);
    },
    hoveredSmallerThanPlayed() {
      return !this.mouseleave && this.hoveredCurrentTime < videodata.time;
    },
    thumbnailWidth() {
      const reactivePhases = {
        phases: [288, 480, 1080],
        thumbnailWidth: [100, 136, 170, 272],
      };
      let widthIndex = reactivePhases.phases.findIndex((value) => {
        if (this.winRatio > 1) return value > this.winHeight;
        return value > this.winWidth;
      });
      if (widthIndex < 0) {
        if ((this.winRatio > 1 && this.winHeight >= 1080)
          || (this.winRatio < 1 && this.winWidth >= 1080)) {
          widthIndex = 3;
        }
      }
      return reactivePhases.thumbnailWidth[widthIndex];
    },
    thumbnailHeight() {
      return Math.floor(this.thumbnailWidth / this.ratio);
    },
    thumbnailPosition() {
      return this.pageXToThumbnailPosition(
        this.hoveredPageX, 20,
        this.thumbnailWidth, this.winWidth,
      );
    },
    fakeButtonHeight() {
      return this.showThumbnail ? `${this.thumbnailHeight + 20}px` : '20px';
    },
    leftFakeProgressBackgroundColor() {
      let opacity = 0.9;
      if (this.hoveredCurrentTime === 0 && this.hoveredSmallerThanPlayed) opacity = 0.3;
      if (this.hoveredCurrentTime > 0) opacity = 0.9;
      return this.whiteWithOpacity(opacity);
    },
  },
  created() {
    document.addEventListener('mousemove', this.handleDocumentMousemove);
    document.addEventListener('mouseup', this.handleDocumentMouseup);
    this.$bus.$on('seek', () => {
      this.progressTriggerStopped = true;
      this.clock.clearTimeout(this.progressTriggerId);
      this.progressTriggerId = this.clock.setTimeout(() => {
        this.progressTriggerStopped = false;
      }, this.progressDisappearDelay);
    });
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.handleDocumentMousemove);
    document.removeEventListener('mouseup', this.handleDocumentMouseup);
  },
  methods: {
    hoveredmouseenter() {
      this.mouseleave = false;
      requestAnimationFrame(this.renderProgressBar);
    },
    // To render the playedProgress when video is playing,
    // it is a difference with the hover-bar effect.
    updatePlayProgressBar(time) {
      const playedPercent = 100 * (time / this.duration);
      const { playedProgress, fakeProgress } = this.$refs;
      playedProgress.style.width = this.hoveredPercent <= playedPercent ? `${playedPercent - this.hoveredPercent}%` : `${playedPercent}%`;
      playedProgress.style.backgroundColor = playedPercent <= this.hoveredPercent || !this.hovering ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)';
      playedProgress.style.order = this.hoveredPercent <= playedPercent ? '1' : '0';
      fakeProgress.style.backgroundColor = this.rightFakeProgressBackgroundColor(time);
    },
    updateHoveredProgressBar(time, hoveredPercent) {
      const playedPercent = 100 * (time / this.duration);
      const { hoveredProgress, defaultProgress } = this.$refs;
      hoveredProgress.style.width = hoveredPercent <= playedPercent ? `${hoveredPercent}%` : `${hoveredPercent - playedPercent}%`;
      hoveredProgress.style.backgroundColor = hoveredPercent <= playedPercent ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)';
      hoveredProgress.style.order = hoveredPercent <= playedPercent ? '0' : '1';
      // the hoveredPercent = -1 means we need to hide it and reset
      if (hoveredPercent === -1) {
        this.setHoveringToFalse(true);
        hoveredProgress.style.width = '0';
      }
      defaultProgress.style.backgroundColor = this.hovering ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)';
    },
    // We need high fps to render hovering of the progress-bar for
    // smooth animation, We use requestAnimationFrame to make it.
    // Listening for mouse enter event and starting the renderProgressBar
    // with requestAnimationFrame, when receiving the mouse leave event stop the renderer.
    renderProgressBar() {
      // We call updatePlayProgressBar here because of
      // the hover-bar and played-bar use flexbox layout
      // and related with the `order` property. if not do
      // this, the layout will be broken.
      this.updatePlayProgressBar(videodata.time);

      this.updateHoveredProgressBar(videodata.time, this.hoveredPercent);

      if (!this.mouseleave) {
        requestAnimationFrame(this.renderProgressBar);
      }
    },
    rightFakeProgressBackgroundColor(time) {
      const hoveredEnd = this.hoveredPercent >= 100;
      const playedEnd = time >= this.duration;
      let opacity = 0;
      if (this.mouseleave) {
        if (playedEnd) {
          opacity = 0.9;
        } else if (this.hovering && hoveredEnd) {
          opacity = 0.3;
        } else if (this.hovering && !hoveredEnd) {
          opacity = 0.1;
        } else {
          opacity = 0;
        }
      } else {
        opacity = hoveredEnd !== playedEnd ? 0.3 : 0.1;
      }
      return this.whiteWithOpacity(hoveredEnd && playedEnd ? 0.9 : opacity);
    },
    handleMousemove(event) {
      this.hoveredPageX = event.pageX;
      this.hovering = true;
      if (this.hoveringId) clearTimeout(this.hoveringId);
      if (event.target !== this.$refs.leftInvisible) this.showThumbnail = true;
      this.mouseleave = false;
    },
    handleDocumentMousemove(event) {
      if (this.mousedown) this.hoveredPageX = event.pageX;
    },
    handleMouseleave() {
      if (!this.mousedown) {
        this.setHoveringToFalse(true);
        this.showThumbnail = false;
        // 这里在没有mouse-down的情况下，才处理mouseleave
        // 如果有mouse-down，mouseleave应该放到document.mouseup中处理
        // 不然document.mousemove无法正确处理progress-bar的play|hover样式
        this.mouseleave = true;
      }
    },
    handleMousedown(event) {
      this.mousedown = true;
      if (event.target === this.$refs.leftInvisible || event.target === this.$refs.rightInvisible) {
        this.showThumbnail = false;
        this.$bus.$emit('currentWidget', 'the-video-controller');
        this.setHoveringToFalse(false);
      }
      if (this.hoveredCurrentTime !== this.duration) {
        this.$bus.$emit('seek', this.hoveredCurrentTime);
        this.$ga.event('app', 'seek');
      }
      if (this.hoveredCurrentTime === 0) {
        this.$bus.$emit('play');
      }
    },
    handleDocumentMouseup(event) {
      const path = event.path || (event.composedPath && event.composedPath());
      const isTargetProgressBar = path.find(e => e.tagName === 'DIV' && e.className.includes('the-progress-bar'));
      // 如果mouseup的target是当前组件，那么不需要触发leave
      if (!isTargetProgressBar) {
        this.mouseleave = true;
        this.showThumbnail = false;
      }
      if (this.mousedown) {
        this.mousedown = false;
        if (this.mouseleave) {
          // 如果mouseup是在组件外，立马移除hover，不做延迟处理
          this.setHoveringToFalse(true);
        }
        this.$bus.$emit('seek', this.hoveredCurrentTime);
      }
    },
    pageXToProportion(pageX, fakeButtonWidth, winWidth) {
      if (pageX <= fakeButtonWidth) return 0;
      if (pageX >= winWidth - fakeButtonWidth) return 1;
      return (pageX - fakeButtonWidth) / (winWidth - (fakeButtonWidth * 2));
    },
    pageXToThumbnailPosition(pageX, fakeButtonWidth, thumbnailWidth, winWidth) {
      if (pageX <= fakeButtonWidth + (thumbnailWidth / 2)) return fakeButtonWidth;
      if (pageX > winWidth - (fakeButtonWidth + (thumbnailWidth / 2))) {
        return winWidth - (fakeButtonWidth + thumbnailWidth);
      }
      return pageX - (thumbnailWidth / 2);
    },
    whiteWithOpacity(opacity) {
      return `rgba(255, 255, 255, ${opacity}`;
    },
    setHoveringToFalse(direct) {
      if (!direct) {
        if (this.hoveringId) {
          clearTimeout(this.hoveringId);
        }
        this.hoveringId = setTimeout(() => {
          this.hovering = false;
        }, 3000);
      } else {
        this.hovering = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.the-progress-bar {
  display: flex;
  align-items: flex-end;
  position: absolute;
  width: 100%;
  bottom: 0;
  -webkit-app-region: no-drag;
  height: 15px;
  z-index: 12;
  & > div {
    transition: background-color 150ms, height 150ms;
  }
  &:hover {
    cursor: pointer;
    & .left .radius {
      border-radius: 0 20px 20px 0;
    }
  }

  .the-preview-thumbnail {
    position: absolute;
  }

  .fake-button {
    position: relative;
    width: 20px;
    .fake-progress {
      transition: height 150ms;
      width: inherit;
      position: absolute;
      bottom: 0;
    }
    &.left .radius{
      content: '';
      width: inherit;
      height: inherit;
      position: absolute;
    }
  }

  .progress {
    display: flex;
    flex-direction: row;
    position: relative;
    width: calc(100% - 40px);
    .hovered {
      position: relative;
    }
    .played {
      position: relative;
    }
    .default {
      flex: 1;
      position: relative;
    }
    & div {
      position: absolute;
      bottom: 0;
      height: inherit;
    }
  }
}
</style>
