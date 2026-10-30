(function(root){
  const fields = [
    ['video','videoType','Тип видео','select',[['all','Все видео'],['videos','Без Shorts'],['shorts','Только Shorts'],['live','Только текущие эфиры']]],
    ['video','hideShorts','Скрыть Shorts','checkbox'],['video','hideLive','Скрыть текущие эфиры','checkbox'],
    ['video','hideWatched','Скрыть просмотренные','checkbox'],['video','hideUpcoming','Скрыть запланированные премьеры','checkbox'],['video','hideMixes','Скрыть плейлисты и миксы','checkbox'],
    ['video','minViews','Просмотры · от','number'],['video','maxViews','Просмотры · до','number'],
    ['video','minMinutes','Длительность, мин · от','number'],['video','maxMinutes','Длительность, мин · до','number'],
    ['video','minSeconds','Точная длительность, сек · от (приоритет)','number'],['video','maxSeconds','Точная длительность, сек · до (приоритет)','number'],
    ['video','maxAgeDays','Не старше, дней','number'],['video','dateFrom','Опубликовано с','date'],['video','dateTo','Опубликовано по (включительно)','date'],
    ['video','minVpd','Средние просмотры/день · от','number'],['video','maxVpd','Средние просмотры/день · до','number'],
    ['video','minLikes','Лайки · от','number'],['video','maxLikes','Лайки · до','number'],
    ['video','minLikeRate','Лайки/просмотры, % · от','number'],['video','maxLikeRate','Лайки/просмотры, % · до','number'],
    ['video','minComments','Комментарии · от','number'],['video','maxComments','Комментарии · до','number'],
    ['video','minCommentRate','Комментарии/просмотры, % · от','number'],['video','maxCommentRate','Комментарии/просмотры, % · до','number'],
    ['video','minPerformance','Просмотры/подписчики, % · от','number'],['video','maxPerformance','Просмотры/подписчики, % · до','number'],
    ['video','requireChapters','Только с главами в описании','checkbox'],['video','requireCaptions','Только с субтитрами','checkbox'],
    ['video','languages','Языки субтитров (коды: ru, en, de)','text'],
    ['channel','channelInclude','Включить каналы по части имени','text'],['channel','channelExclude','Исключить каналы по части имени','text'],
    ['channel','verified','Подтверждённый канал','select',[['all','Любой'],['only','Только подтверждённые'],['exclude','Исключить подтверждённые']]],
    ['channel','minSubs','Подписчики · от','number'],['channel','maxSubs','Подписчики · до','number'],
    ['channel','minChannelVideos','Количество видео канала · от','number'],['channel','maxChannelVideos','Количество видео канала · до','number'],
    ['channel','minChannelViews','Просмотры канала · от','number'],['channel','maxChannelViews','Просмотры канала · до','number'],
    ['channel','channelDateFrom','Канал создан с','date'],['channel','channelDateTo','Канал создан по','date'],
    ['channel','countries','Страны: United States, Russia, …','text'],['channel','countriesExclude','Исключить страны','text'],
    ['channel','channelDescriptionInclude','Слова в описании канала · включить','text'],['channel','channelDescriptionExclude','Слова в описании канала · исключить','text'],
    ['channel','requireEmail','Есть публичный email в описании','checkbox'],['channel','socialInclude','Соцсети: telegram, instagram, discord, …','text'],
    ['text','titleInclude','Название содержит','text'],['text','titleMode','Совпадение включённых слов','select',[['any','Хотя бы одно (через запятую)'],['all','Все (через запятую)'],['phrase','Точная фраза целиком']]],
    ['text','titleExclude','Название не содержит','text'],['text','descriptionInclude','Описание видео содержит','text'],['text','descriptionExclude','Описание видео не содержит','text'],
    ['text','strictSearch','Все слова поискового запроса есть в названии','checkbox'],
    ['settings','enrich','Подгружать публичные данные для фильтров','checkbox'],['settings','badges','Кнопки и статистика под карточками','checkbox'],
    ['settings','unknown','Если данных для активного фильтра нет','select',[['keep','Оставлять видео'],['hide','Скрывать видео']]],
    ['settings','sort','Сортировка загруженных карточек','select',[['original','Порядок YouTube'],['views-desc','Больше просмотров'],['views-asc','Меньше просмотров'],['ageDays-asc','Сначала новые'],['ageDays-desc','Сначала старые'],['seconds-asc','Сначала короткие'],['seconds-desc','Сначала длинные'],['vpd-desc','Средние просмотры/день'],['likes-desc','Больше лайков'],['subs-desc','Больше подписчиков'],['performance-desc','Просмотры/подписчики'],['title-asc','Название А–Я']]]
  ];
  const presets = [
    {name:'Длинные свежие видео',filters:{videoType:'videos',minMinutes:'20',maxAgeDays:'30',hideUpcoming:true}},
    {name:'Популярное за неделю',filters:{minViews:'100000',maxAgeDays:'7',sort:'views-desc',hideShorts:true}},
    {name:'Маленькие каналы',filters:{maxSubs:'10000',minViews:'1000',enrich:true,unknown:'hide'}},
    {name:'Обучение с главами',filters:{minMinutes:'10',requireChapters:true,enrich:true,unknown:'hide',hideShorts:true}},
    {name:'С субтитрами RU / EN',filters:{requireCaptions:true,languages:'ru, en',enrich:true,unknown:'hide'}},
    {name:'Без отвлечений',filters:{hideShorts:true,hideLive:true,hideWatched:true,hideMixes:true,hideUpcoming:true}}
  ];
  root.YTFreeUI={fields,presets};
})(globalThis);
