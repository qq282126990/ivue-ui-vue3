<template>
    <div :class="wrapClasses" :style="wrapStyle">
        <!-- 下划线 -->
        <div
            :class="[`${prefixCls}-divider`]"
            v-if="data.textDirection === 'right' || data.direction === 'horizontal'"
        >
            <i></i>
        </div>
        <!-- 步骤 -->
        <div :class="[`${prefixCls}-header`]">
            <!-- 下划线 -->
            <div
                :class="[`${prefixCls}-divider`]"
                v-if="data.textDirection === 'bottom'|| data.direction === 'vertical' "
            >
                <i></i>
            </div>

            <div :class="[`${prefixCls}-header-content`]">
                <!-- 步骤数 还没完成或者没有错误显示-->
                <span
                    v-if="!icon && !$slots.icon && data.currentStatus !== 'finish' && data.currentStatus !== 'error'"
                >{{ data.stepNumber }}</span>
                <!-- 插槽 -->
                <span v-else-if="$slots.icon" :class="`${prefixCls}s-icon`">
                    <slot name="icon"></slot>
                </span>
                <!-- 图标 -->
                <ivue-icon
                    :class="`${prefixCls}-icon`"
                    v-else
                >{{icon ? icon : data.currentStatus === 'finish' ? 'check' : data.currentStatus === 'error'? 'close': ''}}</ivue-icon>
            </div>
        </div>
        <!-- 文字 -->
        <div :class="[`${prefixCls}-content`]">
            <div :class="[`${prefixCls}-title`]">
                <slot name="title">{{ title }}</slot>
            </div>
            <slot>
                <div :class="[`${prefixCls}-content-slot`]">{{ content }}</div>
            </slot>
        </div>
    </div>
</template>

<script lang='ts'>
import {
    defineComponent,
    computed,
    reactive,
    inject,
    getCurrentInstance,
    onBeforeUnmount,
} from 'vue';

import { oneOf } from '../../utils/assist';

import IvueIcon from '../ivue-icon/index.vue';

const prefixCls = 'ivue-step';

export default defineComponent({
    name: prefixCls,
    props: {
        /**
         * 标题
         *
         * @type {String}
         */
        title: {
            type: String,
            default: '',
        },
        /**
         * 内容
         *
         * @type {String}
         */
        content: {
            type: String,
        },
        /**
         * 当前步骤的状态
         *
         * @type {String}
         */
        status: {
            validator(value: string) {
                return oneOf(value, ['wait', 'process', 'finish', 'error']);
            },
        },
        /**
         * 步骤图标
         *
         * @type {String}
         */
        icon: {
            type: String,
        },
    },
    setup(props: any, { slots }) {
        // inject
        const steps: any = inject('ivue-steps');

        // options
        const options = steps.data.options;

        // vm
        const { uid }: any = getCurrentInstance();

        // data
        const data = reactive<{
            stepNumber: string;
            currentStatus: string;
            nextError: boolean;
            index: number;
            textDirection: string;
            alignCenter: boolean;
            direction: string;
        }>({
            /**
             * 步骤数
             *
             * @type {String}
             */
            stepNumber: '',
            /**
             * 当前状态
             *
             * @type {String}
             */
            currentStatus: props.status,
            /**
             * 下一个错误状态
             *
             * @type {Boolean}
             */
            nextError: false,
            /**
             * 初始化下标
             *
             * @type {Number}
             */
            index: 0,
            /**
             * 文字方向
             *
             * @type {String}
             */
            textDirection: steps.props.textDirection,
            /**
             * 步骤条方向
             *
             * @default {horizontal}
             */
            direction: steps.props.direction,
            /**
             * 进行居中对齐
             *
             * @type {Boolean}
             */
            alignCenter: steps.props.alignCenter,
        });

        // computed

        // 外层class
        const wrapClasses = computed(() => {
            return [
                `${prefixCls}-item`,
                `${prefixCls}-status-${data.currentStatus}`,
                {
                    [`${prefixCls}-custom`]: props.icon || slots.icon,
                    [`${prefixCls}-next-error`]: data.nextError,
                    [`${prefixCls}-text-${data.textDirection}`]: !isVertical.value,
                    [`${prefixCls}-${data.textDirection}-center`]:
                        data.alignCenter && !isVertical.value,
                    [`${prefixCls}-last`]: isLast.value && !steps.props.space && !isCenter.value,
                },
            ];
        });

        // 进行居中对齐
        const isCenter = computed(() => {
            return steps.props.alignCenter;
        });

        // 是否竖向
        const isVertical = computed(() => {
            return steps.props.direction === 'vertical';
        });

        const isLast = computed(() => {
            return options[stepsCount.value - 1]?.uid === uid;
        });

        // 进度总长度
        const stepsCount = computed(() => {
            return options.length;
        });

        // 外层样式
        const wrapStyle = computed(() => {
            const space = steps.props.space;

            const style: Record<string, unknown> = {
                flexBasis:
                    typeof space === 'number'
                        ? `${space}px`
                        : space
                            ? space
                            : `${
                                100 / (options.length - (isCenter.value ? 0 : 1))
                            }%`,
            };

            // 竖向
            if (isVertical.value) {
                return style;
            }

            // 是否是最后一个元素
            if (isLast.value) {
                style.maxWidth = 100 / stepsCount.value + '%';
            }

            return style;
        });

        // onBeforeUnmount
        onBeforeUnmount(() => {
            // 销毁选项
            steps.onOptionDestroy(data.index);
        });

        const stepItemState = reactive({
            uid: uid,
            data: data,
        });

        options.push(stepItemState);

        return {
            prefixCls,

            // data
            data,

            // computed
            wrapClasses,
            wrapStyle,
        };
    },
    components: {
        IvueIcon,
    },
});
</script>
