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
        use: [
          {
            loader: 'mpvue-loader',
            options: vueLoaderConfig
          },
          'mpvue-config-loader'
        ]
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

## Tips

`config` 属性会转换为一个 json 文件，故其中不可使用变量，如需动态修改配置请使用小程序官方的 API
