create table fav_user
(
    id int auto_increment primary key,
    username   varchar(100)                        null,
    password   varchar(255)                        null,
    remark     varchar(255)                        null,
    created_at timestamp default CURRENT_TIMESTAMP null,
    updated_at timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP
)
    comment '用户收藏表' collate = utf8mb4_bin;

create index idx_username
    on fav_user (username);



create table fav_favorites
(
    id                  int unsigned auto_increment comment '主键ID'
        primary key,
    project_name        varchar(255)                               not null comment '项目名称',
    project_url         varchar(500)                               not null comment '项目地址',
    project_description varchar(400)                               null comment '项目详细介绍',
    keywords            varchar(20)                                null comment '项目关键词（逗号分隔）',
    search_tokens       varchar(500)                               null comment '搜索分词（用于全文搜索，存储分词结果）',
    category            varchar(100)                               null comment '项目分类',
    rating              int unsigned default 0                 null comment '评分',
    is_public           tinyint(1)       default 0                 null comment '是否公开（0:私有, 1:公开）',
    tags                varchar(80)                                null comment '标签（逗号分隔）',
    favicon_url         varchar(500)                               null comment '网站图标地址',
    screenshot_url      varchar(500)                               null comment '项目截图地址',
    created_at          timestamp        default CURRENT_TIMESTAMP null comment '创建时间',
    updated_at          timestamp        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint fav_favorites_unique
        unique (project_url)
)
    comment '项目收藏表' collate = utf8mb4_bin;

create index fav_favorites_category_IDX
    on fav_favorites (category, is_public);

create index fav_favorites_search_tokens_IDX
    on fav_favorites (search_tokens);