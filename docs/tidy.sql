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
    project_description text                                       null comment '项目详细介绍',
    keywords            varchar(500)                               null comment '项目关键词（逗号分隔）',
    search_tokens       text                                       null comment '搜索分词（用于全文搜索，存储分词结果）',
    category            varchar(100)                               null comment '项目分类',
    rating              tinyint unsigned default '0'               null comment '评分（0-5）',
    is_public           tinyint(1)       default 0                 null comment '是否公开（0:私有, 1:公开）',
    tags                varchar(300)                               null comment '标签（逗号分隔）',
    favicon_url         varchar(500)                               null comment '网站图标地址',
    screenshot_url      varchar(500)                               null comment '项目截图地址',
    created_at          timestamp        default CURRENT_TIMESTAMP null comment '创建时间',
    updated_at          timestamp        default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint uk_project_url
        unique (project_url(191))
)
    comment '项目收藏表' collate = utf8mb4_bin;

ALTER TABLE fav_favorites 
  ADD FULLTEXT INDEX ft_keywords (keywords) ADD_COLUMNAR_REPLICA_ON_DEMAND;

ALTER TABLE fav_favorites 
  ADD FULLTEXT INDEX ft_project_name (project_name) ADD_COLUMNAR_REPLICA_ON_DEMAND;

ALTER TABLE fav_favorites 
  ADD FULLTEXT INDEX ft_search_tokens (search_tokens) ADD_COLUMNAR_REPLICA_ON_DEMAND;



create index idx_category_created_at on fav_favorites (category, created_at desc);


create index idx_tags on fav_favorites (tags(100));
