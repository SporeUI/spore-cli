# spore

该命令行工具提供项目引擎管理能力，助力项目快速开发。

## 思路

我们把项目管理拆解为模板和引擎两个部分。

模板提供项目开始所需的示例与基础配置，引擎提供项目的开发服务与构建服务能力。

经过充分设计的模板与引擎，可大幅度降低项目配置的心智负担。

妥善管理引擎与模板，可以让项目管理既符合效率提升与规范化的目的，又保证了技术迭代能力。

多个模板共用同一套开发引擎，也可以提升项目创建速度，减少磁盘占用。

这个工具最典型的使用场景是，规范化 H5 活动项目，插件项目等类似重复项目的开发方式。

## 快速开始

安装 spore，推荐安装到全局。

```bash
npm i -g @SporeUI/spore
```

典型使用流程。

```bash
# 创建项目目录
mkdir my-app

# 进入项目目录
cd my-app

# 用默认模板创建项目
spore create .

# 检查有哪些命令
spore run

# 控制塔输出
$ - [serve]: 创建开发服务
$ - [build]: 打包构建代码

# 启动服务
spore run serve

# 构建生成物
spore run build
```

未安装引擎的情况下，第一次启动服务或者构建，会自动安装模板对应的引擎。

## 命令

### 命令公共选项

- `-v, --verbose` 输出详细日志

### `config list`

列举可覆盖的配置项。

示例:

```bash
# 配置默认模板
spore config list
# 执行结果:
$ - [create.dir = app] # 默认创建目录名称
$ - [template.default = example] # 默认使用的模板
$ - [temp.path = ~/.spore] # 临时文件存放路径
```

### `config set <key> <val>`

修改 spore 配置项。

示例:

```bash
# 配置默认模板
spore config set template.default example
```

### `config remove <key>`

移除一个配置项，将还原为默认配置。

示例:

```bash
# 配置默认模板
spore config remove template.default

# 输出
$ - [template.default = default] # 默认使用的模板
```

### `create [options] [dir="app"]`

从模板创建一个项目。

选项:

- `-t, --tpl` 选择使用的模板

参数:

- dir: 文件写入目录，默认路径为 `app`

示例:

```bash
# 文件写入到目录 `app`
spore create

# 文件写入到目录 `my-app`
spore create my-app

# 使用模板 `example`, 项目文件写入到目录 `my-app`
spore create -t example my-app

# 文件写入到当前文件夹
spore create .
```

### `engine list`

列举现有引擎列表

示例:

```bash
# 列举已安装的引擎
spore engine list

输出
$ - spore-engine-vue2
$ - spore-engine-vue2@1.0
```

### `engine install <name>`

安装引擎，默认安装最新版本，可指定版本进行安装。

示例:

```bash
# 安装最新引擎
spore engine install spore-engine-vue2

# 安装指定版本的引擎
spore engine install spore-engine-vue2@1.0
```

### `engine remove <name>`

移除引擎，会删除引擎所在的目录。

示例:

```bash
# 安装最新引擎
spore engine remove spore-engine-vue2

# 移除指定版本的引擎
spore engine remove spore-engine-vue2@1.0
```

### run [name]

执行一个引擎注册的命令，如果不传递命令名称，则列举引擎注册的所有命令。

示例:

```bash
# 列举可用命令
spore run
# 执行结果:
$ - [serve]: 启动开发服务
$ - [build]: 启动构建流程

# 执行 serve 命令
spore run serve
```

### `template list`

列举缓存中记录的模板列表。

示例:

```bash
# 添加一个自定义项目模板，名称为 `example`
spore template list
# 输出缓存列表
$ - [example]: https://github.com/SporeUI/spore-template-example.git
```

### `template set <name> <url>`

配置一个可使用的模板到缓存中。

url 应当为模板的 git 项目地址。

仅被添加到缓存的模板可以用来创建项目。

示例:

```bash
# 添加一个自定义项目模板，名称为 `example`
spore template set example https://github.com/SporeUI/spore-template-example.git
```

### `template remove <name>`

从缓存中移除一个模板。

示例:

```bash
# 移除模板 `example`
spore template remove example
```

## 管理

更新 spore

```bash
npm i -g spore@latest
```

## 引擎设计(from 2.0)

引擎应当发布为一个 npm package。

这样将来可实现引擎多版本共存。

项目引擎命名规范: `spore-engine-${name}`。

例如 `spore-engine-vue2`

引擎必要结构:

模块 main 指定的脚本，暴露一个可执行函数:

```js
// index.js
module.exports = function(spore) {
  spore.register('serve', () => {
    // 开发服务脚本
    spore.nodemon({
      script: spore.cwd('./serve.js'),
      ext: 'js json',
    });
  }, {
    // 这个服务需要监听端口，并检测端口占用
    port: 8090,
    // 配置选项 desc 提供命令说明
    description: 'development serve',
  });

  spore.register('build', () => {
    // 开发构建脚本
  }, {
    // 配置选项 desc 提供命令说明
    description: 'production build',
  });
}
```

引擎需要自行管理对模板的兼容性，一个引擎应当适配所有其匹配的模板。

引擎应当是一个无需任何配置的服务。

spore 对象上提供一些工具来辅助开发服务:

- cwd 返回当前执行路径的函数
- logger 日志管理器
- [nodemon](https://github.com/remy/nodemon) 进程保活工具

## Api

### register(name, options, handler)

注册一条引擎命令，可在模板项目运行 `spore run ${name}` 来执行。

- @param [String] name 在模板可执行的引擎命令名称
- @param [Object] options 引擎命令注册选项
  - @param [String] options.intro 引擎命令介绍
  - @param [Boolean] options.watch 是否监听任务，主要用于开发任务进程保活
- @param [Function] handler 引擎命令执行函数

Example:

```js
// engine ./index.js
module.exports = (spore) => {
  spore.regsiter('serve', {
    intro: '启动开发服务',
  }, () => {
    // run dev server
  });
};
```

## 模板设计

项目模板命名规范: `spore-template-${name}`。

项目模板实际上是一个 git 仓库地址，这个 git 仓库中做好了项目所需的各种配置。

`spore create` 执行时从配置中检索模板的 git 地址，更新模板内容，然后复制模板文件。

使用默认分支作为模板内容。

模板的 `package.json` 中，需要包含模板对应的引擎信息字段: `sporeEngine`。

引擎信息字段可以标注使用的引擎的版本号，规则与 npm package 类似。

示例:

- `"sporeEngine": "spore-engine-vue2"`
- `"sporeEngine": "spore-engine-vue2@1"`

项目通过模板创建完成后，可使用 `spore run` 命令执行引擎提供的命令脚本。

## 常规流程示例

使用流程示例:

```bash
# 列举模板列表
spore template list
# 控制台返回
$ - [example]: http://github.com/SporeUI/spore-template-example.git
# 使用 example 模板创建项目
spore create -t example ./app
# 进入项目目录
cd ./app
# 列举可执行的命令
spore run
# 控制台返回
$ - [serve]: 启动开发服务
$ - [build]: 启动构建流程
# 执行开发服务
spore run serve
# 执行构建服务
spore run build
```

在项目内执行的 `spore run` 命令，也可以封装到项目的 scripts 脚本。

引擎更新流程示例

```bash
# 列举引擎列表
spore engine list
# 控制台返回
$ - spore-engine-vue2
# 更新引擎
spore engine install spore-engine-vue2@latest
```

## 其他信息

临时文件、引擎文件等工具专用文件，存储在 `~/.spore` 目录下。

## 项目信息

- [项目地址](https://github.com/SporeUI/spore)
- [变更日志](https://github.com/SporeUI/spore/blob/master/CHANGELOG.md)
