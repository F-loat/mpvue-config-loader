# mpvue-config-loader

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

`config` 属性会转换为一个 json 文件，故其中不可使用变量，如需动态修改配置请使用小程序官方的 API
