<template>
  <div
    class="thumbnail-wrapper"
    :style="{
      width: thumbnailWidth +'px',
      height: thumbnailHeight +'px',
      transform: `translateX(${positionOfThumbnail}px)`
    }"
  >
    <div
      class="the-preview-thumbnail"
      :style="{height: thumbnailHeight + 2 +'px'}"
    >
      <thumbnail-display
        :thumbnail-width="thumbnailWidth"
        :thumbnail-height="thumbnailHeight"
        :src="src"
        :background-position="backgroundPosition"
        :background-size="backgroundSize"
      />
    </div>
    <div class="thumbnail-gradient" />
    <div class="time">
      <span
        class="flex-items"
        :style="{ color: hoveredEnd ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)'}"
      >{{ videoTime }}</span>
      <transition name="hovered-end">
        <base-icon
          v-if="hoveredEnd"
          class="flex-items hovered-end"
          type="hoveredEnd"
        />
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex';
import { filePathToUrl } from '@/helpers/path';
import { thumbnailService } from '@/services/media/ThumbnailService';
import ThumbnailDisplay from '@/components/PlayingView/ThumbnailDisplay.vue';
// @ts-ignore
import Icon from '@/components/BaseIconContainer.vue';

export default {
  components: {
    'thumbnail-display': ThumbnailDisplay,
    'base-icon': Icon,
  },
  props: {
    currentTime: Number,
    thumbnailWidth: Number,
    thumbnailHeight: Number,
    positionOfThumbnail: Number,
    videoTime: String,
    hoveredEnd: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      thumbnailCount: 0,
      isSaved: false,
      imgExisted: false,
      imgSrc: '',
      backgroundSize: '',
      backgroundPosition: '',
    };
  },
  computed: {
    ...mapGetters(['originSrc', 'mediaHash', 'duration']),
    src() {
      return this.imgExisted || this.isSaved ? `url("${filePathToUrl(this.imgSrc)}")` : '';
    },
  },
  watch: {
    currentTime(val: number) {
      const postion = thumbnailService
        .calculateThumbnailPosition(val, this.duration, this.thumbnailCount);
      this.backgroundPosition = `-${postion[0]}% -${postion[1]}%`;
    },
    originSrc() {
      this.isSaved = false;
      this.imgExisted = false;
      this.imgSrc = '';
    },
  },
  mounted() {
    this.$bus.$on('set-thumbnail-src', (src: string) => {
      if (src === this.originSrc) {
        this.isSaved = true;
      }
    });
    this.$bus.$on('generate-thumbnails', async (num: number) => {
      this.thumbnailCount = num;
      this.backgroundSize = `1000% ${Math.ceil(this.thumbnailCount / 10) * 100}%`;
      try {
        const result = await thumbnailService.getThumbnailImage(this.mediaHash);
        if (!result) {
          this.imgExisted = false;
          this.imgSrc =
            await thumbnailService.generateThumbnailImage(this.mediaHash, this.originSrc, num, 272);
        } else {
          this.imgExisted = true;
          this.imgSrc = result;
        }
      } catch (err) { //
      }
    });
  },
  methods: {
  },
};
</script>
<style lang="scss" scoped>
.thumbnail-wrapper {
  position: absolute;
  bottom: 15px;
  -webkit-app-region: no-drag;
  box-sizing: content-box;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 3px;
}
.the-preview-thumbnail {
  position: absolute;
}
.thumbnail-gradient {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(-180deg, rgba(0,0,0,0.00) 26%, rgba(0,0,0,0.73) 98%);
}
.time {
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;
  height: 100%;
  position: relative;

  @media screen and (max-aspect-ratio: 1/1) and (max-width: 288px),
  screen and (min-aspect-ratio: 1/1) and (max-height: 288px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 289px) and (max-width: 480px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 289px) and (max-height: 480px) {
    font-size: 20px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 481px) and (max-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 481px) and (max-height: 1080px) {
    font-size: 24px;
  }
  @media screen and (max-aspect-ratio: 1/1) and (min-width: 1080px),
  screen and (min-aspect-ratio: 1/1) and (min-height: 1080px) {
    font-size: 40px;
  }
  span {
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-right: 3px;
  }
  .hovered-end-enter-active {
    transition: all 5s;
  }
  .hovered-end-enter-leave {
    transition: all 8s;
  }
}
</style>
