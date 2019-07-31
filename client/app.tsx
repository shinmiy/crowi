import React from 'react'
import ReactDOM from 'react-dom'

import i18n from './i18n'
import moment from 'moment'

import Crowi from './util/Crowi'
import CrowiRenderer from './util/CrowiRenderer'
import CrowiAuth from './util/CrowiAuth'

import HeaderSearchBox from 'components/HeaderSearchBox'
import SearchPage from 'components/SearchPage'
import PageListSearch from 'components/PageListSearch'
import PageHistory from 'components/PageHistory'
import PageAttachment from 'components/PageAttachment'
import PageAlerts from 'components/PageAlerts'
import SeenUserList from 'components/SeenUserList'
import BookmarkButton from 'components/BookmarkButton'
import ShareBox from 'components/ExternalShare/ShareBox'
import SecretKeywordFormContainer from 'components/ExternalShare/SecretKeywordForm/SecretKeywordFormContainer'
import RenameTree from 'components/RenameTree/RenameTree'
import Backlink from './components/Backlink'
import NotificationPage from 'components/NotificationPage'
import HeaderNotification from 'components/HeaderNotification'
import WatchButton from 'components/Notification/WatchButton'
import AdminShare from 'components/Admin/Share/AdminShare'
import AdminRebuildSearch from 'components/Admin/AdminRebuildSearch'

i18n()

moment.locale(navigator.userLanguage || navigator.language)

const mainContent = document.querySelector('#content-main')
let pageId: string | null = null
let pageContent: string | null = null
if (mainContent !== null) {
  pageId = mainContent.getAttribute('data-page-id')
  const rawText = document.getElementById('raw-text-original')
  if (rawText) {
    pageContent = rawText.innerHTML
  }
}

const getTextContent = (element: HTMLElement | null) => (element ? element.textContent : null)

const { user = {} } = JSON.parse(getTextContent(document.getElementById('user-context-hydrate')) || '{}')
const csrfToken = $('#content-main').data('csrftoken')
// FIXME
const crowi = new Crowi({ user, csrfToken }, window)
window.crowi = crowi
crowi.setConfig(JSON.parse(getTextContent(document.getElementById('crowi-context-hydrate')) || '{}'))
const isSharePage = !!$('#content-main').data('is-share-page') || !!$('#secret-keyword-form-container').data('share-id')
if (!isSharePage) {
  crowi.fetchUsers()
}

const crowiRenderer = new CrowiRenderer(crowi)
window.crowiRenderer = crowiRenderer

const crowiAuth = new CrowiAuth(crowi)
window.crowiAuth = crowiAuth

const me = $('body').data('me')
const componentMappings = {
  'search-top': <HeaderSearchBox crowi={crowi} />,
  'search-page': <SearchPage crowi={crowi} />,
  'page-list-search': <PageListSearch crowi={crowi} />,
  'page-attachment': <PageAttachment pageId={pageId} pageContent={pageContent} crowi={crowi} />,
  'page-alerts': <PageAlerts pageId={pageId} crowi={crowi} />,
  //'page-toc': <PageTOC pageId={pageId} crowi={crowi} />,
  'rename-tree': <RenameTree crowi={crowi} />,
  'header-notification': <HeaderNotification me={me} crowi={crowi} />,
  'notification-page': <NotificationPage crowi={crowi} />,

  // 'revision-history': <PageHistory pageId={pageId} />,
  // 'page-comment': <PageComment />,
  'backlink-list': <Backlink pageId={pageId} crowi={crowi} />,
  'seen-user-list': <SeenUserList crowi={crowi} />,
  'bookmark-button': <BookmarkButton pageId={pageId} crowi={crowi} />,
  'share-box': <ShareBox pageId={pageId} crowi={crowi} />,
  'secret-keyword-form-container': <SecretKeywordFormContainer crowi={crowi} />,
  'watch-button': <WatchButton pageId={pageId} crowi={crowi} />,
  'admin-share': <AdminShare crowi={crowi} />,
  'admin-rebuild-search': <AdminRebuildSearch crowi={crowi} />,
}

Object.entries(componentMappings).forEach(([key, component]) => {
  const elem = document.getElementById(key)
  if (elem) {
    ReactDOM.render(component, elem)
  }
})

// うわーもうー
$('a[data-toggle="tab"][href="#revision-history"]').on('show.bs.tab', function() {
  ReactDOM.render(<PageHistory pageId={pageId} crowi={crowi} />, document.getElementById('revision-history'))
})
