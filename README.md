# mpvue-config-loader

> 实现在 vue 文件中书写小程序的页面配置，不再需要单独的 main.json 文件

[![npm package](https://img.shields.io/npm/v/mpvue-config-loader.svg)](https://npmjs.org/package/mpvue-config-loader)
[![npm downloads](https://img.shields.io/npm/dw/mpvue-config-loader.svg)](https://npmjs.org/package/mpvue-config-loader)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/F-loat/mpvue-config-loader/blob/master/LICENSE)
[![juejin](https://badge.juejin.im/entry/5bffd5de51882526a643fcd1/likes.svg)](https://juejin.im/post/5bffd5de51882526a643fcd1)

## 安装

``` bash
npm i mpvue-config-loader -D
```

## 使用

``` js
// webpack.base.conf.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'mpvue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.vue$/,
        loader: 'mpvue-config-loader',
        exclude: [resolve('src/components')],
        options: {
          entry: './main.js'
        }
      },
      ...
    ]
  }
  ...
}
```

``` vue
<script>
// src/app.vue
export default {
  config: {
    window: {
      navigationBarTitleText: '小程序标题'
    }
  },
  globalConfig: {
    usingComponents: [
      ...
    ]
  }
}
</script>
```

``` vue
<script>
// src/xx/xxx.vue
export default {
  config: {
    navigationBarTitleText: '页面标题'
  }
}
</script>
```

## Options

| property | type | required | describe |
| :-: | :-: | :-: | :-: |
| entry | string | false | 入口文件相对路径 |
| transform | function | false | 自定义文件名转换函数 |

## Tips

* `config` 属性会转换为一个 json 文件，故其中不可使用变量，如需动态修改配置请使用小程序官方的 API

* app.vue 文件的 `globalConfig` 属性会与页面配置进行合并，可实现全局引用原生组件

* 页面若无 `config` 属性，请指定 `mpType: 'page'` 以生成全局配置
