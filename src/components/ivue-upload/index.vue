<template>
    <div :class="prefixCls">
        <slot></slot>

        <!-- 列表 -->
        <upload-list
            :files="data.fileList"
            :failedIcon="failedIcon"
            :deletable="deletable"
            :name="name"
            :previewSize="previewSize"
            :beforeDelete="beforeDelete"
            @delete="handleRemove"
            @preview="handleFileData"
            v-if="previewImage"
        >
            <template v-if="$slots['preview-cover']" #preview-cover="{ file }">
                <slot name="preview-cover" :file="file"></slot>
            </template>
        </upload-list>
        <!-- 输入框 -->
        <div :class="inputWrapClass" @click="handleClickInput" v-show="renderUpload">
            <input
                type="file"
                ref="input"
                :class="`${prefixCls}-input`"
                :accept="accept"
                :multiple="multiple"
                @change="handleChange"
            />
            <slot>
                <div
                    :class="{
                    [`${prefixCls}-content`]: true,
                    [`${prefixCls}-disabled`]: disabled,
                }"
                    :style="getSizeStyle(previewSize)"
                >
                    <!-- 图标 -->
                    <ivue-icon :class="`${prefixCls}-content__icon`">cloud_upload</ivue-icon>
                    <p :class="`${prefixCls}-content__text`">点击上传</p>
                </div>
            </slot>
        </div>
    </div>
</template>

<script lang='ts'>
import { defineComponent, computed, ref, reactive, PropType, watch } from 'vue';

import IvueIcon from '../ivue-icon/index.vue';
import UploadList from './upload-list.vue';

import { oneOf } from '../../utils/assist';
import { isPromise } from '../../utils/validate';
import { Interceptor } from '../../utils/interceptor';

import {
    readFileContent,
    isOversize,
    UploaderFileListItem,
    UploaderResultType,
    UploaderMaxSize,
    filterFiles,
    toArray,
    getSizeStyle,
} from '../../utils/helpers';

const prefixCls = 'ivue-upload';

type PromiseOrNot<T> = T | Promise<T>;

export type UploaderAfterRead = (
    items: UploaderFileListItem | UploaderFileListItem[],
    detail: {
        name: string | number;
        index: number;
    }
) => void;

export type UploaderBeforeRead = (
    file: File | File[],
    detail: {
        name: string | number;
        index: number;
    }
) => PromiseOrNot<File | File[] | undefined>;

export default defineComponent({
    name: prefixCls,
    emits: ['update:modelValue', 'on-oversize', 'on-delete', 'on-preview'],
    props: {
        /**
         * 上传组件类型
         *
         * @type {String}
         *
         * select (点击选择)
         *
         * drag (支持拖动)
         */
        type: {
            type: String,
            validator(value: string) {
                return oneOf(value, ['select', 'drag']);
            },
            default: 'select',
        },
        /**
         * 接受的上传类型
         *
         * @type {String}
         */
        accept: {
            type: String,
        },
        /**
         * 是否支持多选文件
         *
         * @type {Boolean}
         */
        multiple: {
            type: Boolean,
            default: false,
        },
        /**
         * 是否禁用
         *
         * @type {Boolean}
         */
        disabled: {
            type: Boolean,
            default: false,
        },
        /**
         * 文件读取结果类型，可选值为 file text dataUrl
         *
         * @type {String}
         */
        resultType: {
            type: String as PropType<UploaderResultType>,
            default: 'dataUrl',
        },
        /**
         * 返回的数据
         *
         * @type {Array}
         */
        modelValue: {
            type: Array as PropType<UploaderFileListItem[]>,
            default: () => [],
        },
        /**
         * 文件大小限制，单位为 byte
         *
         * @type {number | string | (file: File) => boolean}
         */
        maxSize: {
            type: [Number, String, Function] as PropType<UploaderMaxSize>,
            default: Number.MAX_VALUE,
        },
        /**
         * 文件上传数量限制
         *
         * @type {Number, String}
         */
        maxCount: {
            type: [Number, String],
            default: Number.MAX_VALUE,
        },
        /**
         * 文件读取完成后的回调函数
         *
         * @type {Boolean}
         */
        afterRead: {
            type: Function as PropType<UploaderAfterRead>,
        },
        /**
         * before-read	文件读取前的回调函数，返回 false 可终止文件读取，支持返回 Promise
         *
         * @type {Function}
         */
        beforeRead: {
            type: Function as PropType<UploaderBeforeRead>,
        },
        /**
         * 标识符，可以在回调函数的第二项参数中获取
         *
         * @type {Number, String}
         */
        name: {
            type: [Number, String],
            default: '',
        },
        /**
         * 错误时的图标
         *
         * @type {String}
         */
        failedIcon: {
            type: String,
            default: '',
        },
        /**
         * 是否展示删除按钮
         *
         * @type {Boolean}
         */
        deletable: {
            type: Boolean,
            default: true,
        },
        /**
         * 是否展示上传区域
         *
         * @type {Boolean}
         */
        showUpload: {
            type: Boolean,
            default: true,
        },
        /**
         * 预览图和上传区域的尺寸，默认单位为 px
         *
         * @type {Number | String}
         */
        previewSize: [Number, String],
        /**
         * 是否在上传完成后展示预览图
         *
         * @type {Boolean}
         */
        previewImage:{
            type: Boolean,
            default: true,
        },
        /**
         * 文件删除前的回调函数，返回 false 可终止文件读取，
         * 支持返回 Promise
         *
         * @type {Function}
         */
        beforeDelete: {
            type: Function as PropType<Interceptor>,
        },
    },
    setup(props: any, { emit }) {
        // dom
        const input = ref(null);

        // data
        const data = reactive<{
            fileList: Array<any>;
        }>({
            /**
             * 当前选择状态
             *
             * @type {Array}
             */
            fileList: props.modelValue,
        });

        // computed

        const inputWrapClass = computed(() => {
            return [
                {
                    [`${prefixCls}-select`]: props.type === 'select',
                    [`${prefixCls}-drag`]: props.type === 'drag',
                    [`${prefixCls}-dragOver`]:
                        props.type === 'drag' && props.dragOver,
                },
            ];
        });

        // 判断图片上传数量
        const renderUpload = computed(() => {
            if (
                props.modelValue.length >= props.maxCount ||
                !props.showUpload
            ) {
                return false;
            }

            return true;
        });

        // methods

        // 点击输入框
        const handleClickInput = () => {
            if (props.disabled) {
                return;
            }

            // 剩余数量
            const remainCount = +props.maxCount - props.modelValue.length;

            // 到达限制数量禁止上传
            if (remainCount === 0) {
                return;
            }

            input.value.click();
        };

        // 输入框数据改变
        const handleChange = (event) => {
            const { files } = event.target as HTMLInputElement;

            if (!files) {
                return;
            }

            const file =
                files.length === 1
                    ? files[0]
                    : ([].slice.call(files) as File[]);

            // 文件读取前的回调函数
            if (props.beforeRead) {
                const response = props.beforeRead(file, getDetail());

                // 没有会调重置输入框
                if (!response) {
                    resetInput();
                    return;
                }

                if (isPromise(response)) {
                    response
                        .then((data) => {
                            if (data) {
                                uploadFiles(data);
                            } else {
                                uploadFiles(file);
                            }
                        })
                        .catch(resetInput);
                    return;
                }
            }

            // 获取上传文件
            uploadFiles(file);
        };

        // 获取上传文件
        const uploadFiles = (files) => {
            if (Array.isArray(files)) {
                // 剩余数量
                const remainCount = +props.maxCount - props.modelValue.length;

                if (files.length > remainCount) {
                    files = files.slice(0, remainCount);
                }

                // 表示文件读取结果的类型
                Promise.all(
                    files.map((file) => readFileContent(file, props.resultType))
                ).then((contents) => {
                    const fileList = (files as File[]).map((file, index) => {
                        const result: UploaderFileListItem = {
                            file,
                            status: '',
                            message: '',
                        };

                        if (contents[index]) {
                            result.content = contents[index] as string;
                        }

                        return result;
                    });

                    // 文件读取完成后的回调函数
                    onAfterRead(fileList);
                });
            } else {
                // 读取文件数据
                readFileContent(files, props.resultType).then((content) => {
                    const result: UploaderFileListItem = {
                        file: files as File,
                        status: '',
                        message: '',
                    };

                    if (content) {
                        result.content = content;
                    }

                    // 文件读取完成后的回调函数
                    onAfterRead(result);
                });
            }
        };

        // 文件读取完成后的回调函数
        const onAfterRead = (
            items: UploaderFileListItem | UploaderFileListItem[]
        ) => {
            // 清除输入框数据
            resetInput();

            if (isOversize(items, props.maxSize)) {
                if (Array.isArray(items)) {
                    const result = filterFiles(items, props.maxSize);
                    items = result.valid;

                    emit('on-oversize', result.invalid, getDetail());

                    if (!items.length) {
                        return;
                    }
                } else {
                    emit('on-oversize', items, getDetail());
                    return;
                }
            }

            items = reactive(items);

            emit('update:modelValue', [...props.modelValue, ...toArray(items)]);

            if (props.afterRead) {
                props.afterRead(items, getDetail());
            }
        };

        // 清除输入框数据
        const resetInput = () => {
            if (input.value) {
                input.value.value = '';
            }
        };

        // 获取详情
        const getDetail = (index = props.modelValue.length) => ({
            name: props.name,
            index,
        });

        // 删除函数
        const handleRemove = (file, index) => {
            data.fileList.splice(index, 1);

            emit('update:modelValue', data.fileList);
            emit('on-delete', file, getDetail(index));
        };

        // 查看图片
        const handleFileData = (file) => {
            emit('on-preview', file);
        };

        // 监听数据变化
        watch(
            () => props.modelValue,
            (value) => {
                data.fileList = value;
            }
        );

        return {
            prefixCls,

            // data
            data,

            // dom
            input,

            // computed
            inputWrapClass,

            // methods
            handleClickInput,
            handleChange,
            handleRemove,
            handleFileData,
            uploadFiles,
            renderUpload,
            getSizeStyle,
        };
    },
    components: {
        UploadList,
        IvueIcon,
    },
});
</script>
