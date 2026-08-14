(() => {
  const root = document.documentElement;
  const body = document.body;
  const themeButton = document.querySelector('.theme-toggle');

  const applyTheme = (mode) => {
    root.dataset.theme = mode;
    if (themeButton) {
      const target = mode === 'dark' ? '亮色' : '暗色';
      themeButton.textContent = target;
      themeButton.setAttribute('aria-label', `当前为${mode === 'dark' ? '暗色' : '亮色'}模式，切换到${target}模式`);
      themeButton.setAttribute('title', `切换到${target}模式`);
    }
  };

  let themeMode = localStorage.getItem('algorithm-template-theme');
  if (themeMode !== 'light' && themeMode !== 'dark') {
    themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(themeMode);

  themeButton?.addEventListener('click', () => {
    themeMode = themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('algorithm-template-theme', themeMode);
    applyTheme(themeMode);
  });

  const navigationButton = document.querySelector('.nav-toggle');
  const navigationBackdrop = document.querySelector('.sidebar-backdrop');
  const closeNavigation = () => {
    body.classList.remove('nav-open');
    navigationButton?.setAttribute('aria-expanded', 'false');
  };
  navigationButton?.addEventListener('click', () => {
    const open = !body.classList.contains('nav-open');
    body.classList.toggle('nav-open', open);
    navigationButton.setAttribute('aria-expanded', String(open));
  });
  navigationBackdrop?.addEventListener('click', closeNavigation);
  document.querySelectorAll('.site-sidebar a').forEach((link) => {
    link.addEventListener('click', closeNavigation);
  });

  document.querySelectorAll('.sidebar-group-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const list = document.getElementById(button.getAttribute('aria-controls'));
      if (!list) return;
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? '收起' : '展开';
      list.hidden = !expanded;
    });
  });

  const legacyCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.inset = '0 auto auto -9999px';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('浏览器拒绝了复制操作');
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        legacyCopy(text);
        return;
      }
    }
    legacyCopy(text);
  };

  const showButtonState = (button, message, className = '') => {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = message;
    button.disabled = true;
    if (className) button.classList.add(className);
    window.setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
      if (className) button.classList.remove(className);
    }, 1500);
  };

  document.querySelectorAll('.copy-code-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = button.closest('.code-block')?.querySelector('.code-source');
      if (!(source instanceof HTMLTextAreaElement)) {
        showButtonState(button, '未找到代码');
        return;
      }
      try {
        await copyText(source.value);
        showButtonState(button, '已复制', 'copied');
      } catch {
        showButtonState(button, '复制失败');
      }
    });
  });

  const polyButton = document.querySelector('.copy-poly-button');
  polyButton?.addEventListener('click', async () => {
    const source = document.querySelector('.poly-bundle-source');
    const status = document.querySelector('.poly-bundle-status');
    if (!(source instanceof HTMLTextAreaElement)) return;
    try {
      await copyText(source.value);
      const lines = source.value.trimEnd().split('\n').length;
      showButtonState(polyButton, '封装已复制', 'copied');
      if (status) status.textContent = `已复制 ${lines} 行，可以直接粘贴到比赛骨架之后。`;
    } catch {
      showButtonState(polyButton, '复制失败');
      if (status) status.textContent = '浏览器没有授予剪贴板权限，请重新点击或更换浏览器。';
    }
  });

  const searchDialog = document.querySelector('.search-dialog');
  const searchInput = document.querySelector('#site-search');
  const searchResults = document.querySelector('.search-results');
  const searchForm = document.querySelector('.search-panel');
  const searchItems = Array.isArray(window.SEARCH_INDEX) ? window.SEARCH_INDEX : [];
  const rootHref = body.dataset.root || './';

  const closeSearch = () => {
    if (searchDialog instanceof HTMLDialogElement && searchDialog.open) searchDialog.close();
  };

  const openSearch = () => {
    if (!(searchDialog instanceof HTMLDialogElement)) return;
    if (!searchDialog.open) searchDialog.showModal();
    window.requestAnimationFrame(() => searchInput?.focus());
  };

  document.querySelectorAll('.search-open').forEach((button) => {
    button.addEventListener('click', openSearch);
  });

  searchForm?.addEventListener('submit', (event) => {
    if (!event.submitter?.classList.contains('search-close')) event.preventDefault();
  });

  const normalizeSearchText = (value) => value.toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ').trim();
  const renderSearchResults = () => {
    if (!searchResults || !(searchInput instanceof HTMLInputElement)) return;
    const query = normalizeSearchText(searchInput.value);
    searchResults.replaceChildren();

    if (!query) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = searchItems.length ? '输入关键词开始搜索。' : '搜索索引加载失败。';
      searchResults.append(empty);
      return;
    }

    const ranked = searchItems
      .map((item) => {
        const title = normalizeSearchText(item.title || '');
        const category = normalizeSearchText(item.category || '');
        const purpose = normalizeSearchText(item.purpose || '');
        const complexity = normalizeSearchText(item.complexity || '');
        let score = 0;
        if (title === query) score += 120;
        else if (title.startsWith(query)) score += 80;
        else if (title.includes(query)) score += 55;
        if (category.includes(query)) score += 25;
        if (purpose.includes(query)) score += 18;
        if (complexity.includes(query)) score += 8;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title, 'zh-CN'))
      .slice(0, 12);

    if (!ranked.length) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = `没有找到“${searchInput.value.trim()}”。`;
      searchResults.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    ranked.forEach(({ item }) => {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = `${rootHref}${item.path}`;
      const title = document.createElement('strong');
      title.textContent = item.title;
      const category = document.createElement('small');
      category.textContent = item.category;
      const purpose = document.createElement('p');
      purpose.textContent = item.purpose || item.complexity || '打开模板查看说明与代码。';
      link.append(title, category, purpose);
      fragment.append(link);
    });
    searchResults.append(fragment);
  };

  searchInput?.addEventListener('input', renderSearchResults);
  searchDialog?.addEventListener('click', (event) => {
    if (event.target === searchDialog) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape') closeNavigation();
  });
})();
