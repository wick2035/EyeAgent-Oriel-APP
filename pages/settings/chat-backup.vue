<template>
  <view class="page" :class="{ 'page--dark': isDark }">
    <!-- 背景层 -->
    <view class="bg-layer">
      <view class="bg-gradient"></view>
      <view class="particles">
        <view
          v-for="i in 8"
          :key="i"
          class="particle"
          :class="`particle--${i}`"
        ></view>
      </view>
    </view>

    <!-- 内容区 -->
    <view class="content">
      <view
        class="status-bar"
        :style="{ height: statusBarHeight + 'px' }"
      ></view>

      <!-- 导航栏 -->
      <view class="navbar" :class="{ 'navbar--visible': pageReady }">
        <view class="navbar__back" @click="goBack">
          <view class="back-icon"></view>
        </view>
        <text class="navbar__title">聊天数据迁移</text>
        <view class="navbar__placeholder"></view>
      </view>

      <!-- 滚动区域 -->
      <scroll-view class="scroll-area" scroll-y>
        <!-- Hero 图标 -->
        <view class="hero-section" :class="{ 'section--visible': pageReady }">
          <view class="hero-icon">
            <view class="shield">
              <view class="shield-body">
                <view class="shield-arrows">
                  <view class="arrow arrow--up"></view>
                  <view class="arrow arrow--down"></view>
                </view>
              </view>
              <view class="shield-glow"></view>
            </view>
          </view>
        </view>

        <!-- 信息卡片 -->
        <view
          class="info-card"
          :class="{ 'section--visible': pageReady }"
          style="--delay: 0.1s"
        >
          <view class="info-card__badge">
            <text class="info-card__badge-text">i</text>
          </view>
          <text class="info-card__text">
            更换设备时，导出并导入聊天数据可确保您在新设备上继续查看加密聊天记录。导出文件将使用您设置的密码加密保护。
          </text>
        </view>

        <!-- 操作卡片区 -->
        <view
          class="action-section"
          :class="{ 'section--visible': pageReady }"
          style="--delay: 0.2s"
        >
          <!-- 导出卡片 -->
          <view
            class="action-card action-card--export"
            :class="{ 'action-card--disabled': !hasKey }"
            @click="startExport"
          >
            <view class="action-card__accent action-card__accent--export"></view>
            <view class="action-card__icon action-card__icon--export">
              <view class="export-arrow"></view>
            </view>
            <view class="action-card__body">
              <text class="action-card__title">导出聊天数据</text>
              <text class="action-card__desc" v-if="hasKey">将聊天密钥导出为加密备份文件</text>
              <text class="action-card__desc action-card__desc--muted" v-else>暂无聊天数据可导出</text>
            </view>
            <view class="action-card__arrow" v-if="hasKey"></view>
          </view>

          <!-- 导入卡片 -->
          <view
            class="action-card action-card--import"
            @click="startImport"
          >
            <view class="action-card__accent action-card__accent--import"></view>
            <view class="action-card__icon action-card__icon--import">
              <view class="import-arrow"></view>
            </view>
            <view class="action-card__body">
              <text class="action-card__title">导入聊天数据</text>
              <text class="action-card__desc">从备份文件恢复聊天密钥到当前设备</text>
            </view>
            <view class="action-card__arrow"></view>
          </view>
        </view>

        <!-- 安全提示 -->
        <view
          class="security-note"
          :class="{ 'section--visible': pageReady }"
          style="--delay: 0.3s"
        >
          <view class="security-note__icon"></view>
          <text class="security-note__text">备份文件使用您设置的密码加密保护，请妥善保管密码和备份文件</text>
        </view>

        <view class="bottom-space"></view>
      </scroll-view>
    </view>

    <!-- 导出密码弹窗 -->
    <view class="modal" :class="{ 'modal--show': showExportModal }">
      <view class="modal__overlay" @click="closeExportModal"></view>
      <view class="modal__sheet" :style="keyboardHeight ? { transform: 'translateY(-' + keyboardHeight + 'px)' } : {}">
        <view class="modal__header">
          <text class="modal__title">设置备份密码</text>
          <view class="modal__close" @click="closeExportModal">
            <view class="close-x"></view>
          </view>
        </view>

        <view class="modal__body">
          <!-- 密码 -->
          <view class="input-group">
            <text class="input-label">备份密码</text>
            <view
              class="input-wrapper"
              :class="{ 'input-wrapper--focus': focusField === 'exportPwd' }"
            >
              <input
                class="input-field"
                :type="showExportPassword ? 'text' : 'password'"
                v-model="exportPassword"
                placeholder="请设置备份密码（至少6位）"
                placeholder-class="input-placeholder"
                :cursor-spacing="80"
                @focus="focusField = 'exportPwd'"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showExportPassword = !showExportPassword"
              >
                <image
                  class="eye-icon"
                  :src="showExportPassword ? '/static/eye-open.svg' : '/static/eye-off.svg'"
                  mode="aspectFit"
                />
              </view>
            </view>
            <!-- 密码强度 -->
            <view class="strength-bar" v-if="exportPassword">
              <view class="strength-track">
                <view
                  class="strength-fill"
                  :class="[`strength-fill--${passwordStrength.level}`]"
                  :style="{ width: passwordStrength.width }"
                ></view>
              </view>
              <text
                class="strength-text"
                :class="[`strength-text--${passwordStrength.level}`]"
              >{{ passwordStrength.text }}</text>
            </view>
          </view>

          <!-- 确认密码 -->
          <view class="input-group input-group--last">
            <text class="input-label">确认密码</text>
            <view
              class="input-wrapper"
              :class="{
                'input-wrapper--focus': focusField === 'exportConfirm',
                'input-wrapper--error': exportPasswordConfirm && !exportPasswordsMatch,
                'input-wrapper--success': exportPasswordConfirm && exportPasswordsMatch,
              }"
            >
              <input
                class="input-field"
                :type="showExportPasswordConfirm ? 'text' : 'password'"
                v-model="exportPasswordConfirm"
                placeholder="请再次输入密码"
                placeholder-class="input-placeholder"
                :cursor-spacing="80"
                @focus="focusField = 'exportConfirm'"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showExportPasswordConfirm = !showExportPasswordConfirm"
              >
                <image
                  class="eye-icon"
                  :src="showExportPasswordConfirm ? '/static/eye-open.svg' : '/static/eye-off.svg'"
                  mode="aspectFit"
                />
              </view>
            </view>
            <view class="match-hint" v-if="exportPasswordConfirm">
              <view
                class="match-icon"
                :class="{ 'match-icon--success': exportPasswordsMatch }"
              >
                <view v-if="exportPasswordsMatch" class="check-mark"></view>
                <view v-else class="cross-mark"></view>
              </view>
              <text
                class="match-text"
                :class="{ 'match-text--success': exportPasswordsMatch }"
              >{{ exportPasswordsMatch ? '密码一致' : '密码不一致' }}</text>
            </view>
          </view>
        </view>

        <view class="modal__footer">
          <view
            class="modal-btn modal-btn--primary"
            :class="{
              'modal-btn--disabled': !canExport,
              'modal-btn--loading': exportLoading,
            }"
            @click="doExport"
          >
            <view v-if="exportLoading" class="loading-spinner">
              <view class="spinner-ring"></view>
            </view>
            <text v-else class="modal-btn__text">导出备份文件</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导入密码弹窗 -->
    <view class="modal" :class="{ 'modal--show': showImportModal }">
      <view class="modal__overlay" @click="closeImportModal"></view>
      <view class="modal__sheet" :style="keyboardHeight ? { transform: 'translateY(-' + keyboardHeight + 'px)' } : {}">
        <view class="modal__header">
          <text class="modal__title">输入备份密码</text>
          <view class="modal__close" @click="closeImportModal">
            <view class="close-x"></view>
          </view>
        </view>

        <view class="modal__body">
          <view class="import-file-info" v-if="importBundle">
            <view class="import-file-info__icon"></view>
            <view class="import-file-info__detail">
              <text class="import-file-info__name">聊天数据备份</text>
              <text class="import-file-info__date">{{ importBundleDate }}</text>
            </view>
          </view>

          <view class="input-group input-group--last">
            <text class="input-label">备份密码</text>
            <view
              class="input-wrapper"
              :class="{
                'input-wrapper--focus': focusField === 'importPwd',
                'input-wrapper--error': importError,
              }"
            >
              <input
                class="input-field"
                :type="showImportPassword ? 'text' : 'password'"
                v-model="importPassword"
                placeholder="请输入导出时设置的密码"
                placeholder-class="input-placeholder"
                :cursor-spacing="80"
                @focus="focusField = 'importPwd'; importError = ''"
                @blur="focusField = ''"
              />
              <view
                class="eye-toggle"
                @click="showImportPassword = !showImportPassword"
              >
                <image
                  class="eye-icon"
                  :src="showImportPassword ? '/static/eye-open.svg' : '/static/eye-off.svg'"
                  mode="aspectFit"
                />
              </view>
            </view>
            <view class="error-hint" v-if="importError">
              <text class="error-hint__text">{{ importError }}</text>
            </view>
          </view>
        </view>

        <view class="modal__footer">
          <view
            class="modal-btn modal-btn--primary"
            :class="{
              'modal-btn--disabled': !canImport,
              'modal-btn--loading': importLoading,
            }"
            @click="doImport"
          >
            <view v-if="importLoading" class="loading-spinner">
              <view class="spinner-ring"></view>
            </view>
            <text v-else class="modal-btn__text">恢复聊天数据</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 成功弹窗 -->
    <view class="success-modal" :class="{ 'success-modal--show': showSuccess }">
      <view class="success-modal__overlay" @click="closeSuccess"></view>
      <view class="success-modal__content">
        <view class="success-icon">
          <view class="success-check"></view>
          <view class="success-circle"></view>
        </view>
        <text class="success-title">{{ successTitle }}</text>
        <text class="success-desc">{{ successDesc }}</text>
        <view class="success-btn" @click="closeSuccess">
          <text class="success-btn__text">我知道了</text>
        </view>
      </view>
    </view>

    <!-- 覆盖确认弹窗 -->
    <ConfirmDialog
      ref="overwriteDialog"
      title="覆盖提示"
      content="当前设备已有聊天密钥，导入将覆盖现有数据。覆盖后，使用旧密钥加密的消息可能无法解密。确定继续吗？"
      icon="warning"
      confirmText="继续导入"
      cancelText="取消"
      @confirm="confirmOverwriteImport"
    />

    <TopNotificationBar />
  </view>
</template>

<script>
import { isDarkMode } from '@/store/theme.js'
import { getUserInfo } from '@/store/user.js'
import { exportKeyBundle, importKeyBundle, validateBundle, hasExportableKey } from '@/utils/crypto/keyExport.js'
import { hasStoredKey } from '@/utils/crypto/keyStorage.js'
import { clearAllKeys } from '@/utils/crypto/e2eeCrypto.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TopNotificationBar from '@/components/TopNotificationBar.vue'

export default {
  components: {
    ConfirmDialog,
    TopNotificationBar,
  },
  data() {
    return {
      statusBarHeight: 44,
      pageReady: false,
      hasKey: false,
      focusField: '',
      // 导出
      showExportModal: false,
      exportPassword: '',
      exportPasswordConfirm: '',
      showExportPassword: false,
      showExportPasswordConfirm: false,
      exportLoading: false,
      // 导入
      showImportModal: false,
      importPassword: '',
      showImportPassword: false,
      importLoading: false,
      importError: '',
      importBundle: null,
      // 成功
      showSuccess: false,
      successTitle: '',
      successDesc: '',
      // 键盘
      keyboardHeight: 0,
    }
  },
  computed: {
    isDark() {
      return isDarkMode()
    },
    passwordStrength() {
      const pwd = this.exportPassword
      if (!pwd) return { level: 'none', text: '', width: '0%' }
      let score = 0
      if (pwd.length >= 6) score += 1
      if (pwd.length >= 8) score += 1
      if (/\d/.test(pwd)) score += 1
      if (/[a-z]/.test(pwd)) score += 1
      if (/[A-Z]/.test(pwd)) score += 1
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 2
      if (score <= 4) return { level: 'weak', text: '弱', width: '33%' }
      if (score <= 6) return { level: 'medium', text: '中', width: '66%' }
      return { level: 'strong', text: '强', width: '100%' }
    },
    exportPasswordsMatch() {
      return this.exportPassword && this.exportPasswordConfirm && this.exportPassword === this.exportPasswordConfirm
    },
    canExport() {
      return this.exportPassword.length >= 6 && this.exportPasswordsMatch && !this.exportLoading
    },
    canImport() {
      return this.importPassword.length >= 1 && this.importBundle && !this.importLoading
    },
    importBundleDate() {
      if (!this.importBundle || !this.importBundle.createdAt) return ''
      try {
        const d = new Date(this.importBundle.createdAt)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } catch (e) {
        return ''
      }
    },
  },
  onLoad() {
    this.getStatusBarHeight()
    this.hasKey = hasExportableKey()
    uni.onKeyboardHeightChange((res) => {
      this.keyboardHeight = res.height || 0
    })
    setTimeout(() => {
      this.pageReady = true
    }, 100)
  },
  methods: {
    getStatusBarHeight() {
      const sysInfo = uni.getSystemInfoSync()
      this.statusBarHeight = sysInfo.statusBarHeight || 44
    },
    goBack() {
      uni.navigateBack()
    },

    // ========== 导出 ==========
    startExport() {
      if (!this.hasKey) {
        uni.showToast({ title: '暂无聊天数据可导出', icon: 'none' })
        return
      }
      this.exportPassword = ''
      this.exportPasswordConfirm = ''
      this.showExportPassword = false
      this.showExportPasswordConfirm = false
      this.showExportModal = true
    },
    closeExportModal() {
      if (this.exportLoading) return
      this.showExportModal = false
    },
    async doExport() {
      if (!this.canExport) return
      this.exportLoading = true
      try {
        const userInfo = getUserInfo()
        if (!userInfo || !userInfo.id) {
          uni.showToast({ title: '用户未登录', icon: 'none' })
          return
        }

        const bundle = exportKeyBundle(userInfo.id, this.exportPassword)
        const jsonStr = JSON.stringify(bundle, null, 2)

        // #ifdef APP-PLUS
        await this.saveAndShareFile(jsonStr)
        // #endif

        // #ifndef APP-PLUS
        // H5 或小程序环境：复制到剪贴板
        uni.setClipboardData({
          data: jsonStr,
          success: () => {
            this.showExportModal = false
            this.successTitle = '导出成功'
            this.successDesc = '备份数据已复制到剪贴板，请粘贴保存到安全位置'
            this.showSuccess = true
          },
        })
        // #endif
      } catch (e) {
        if (e.message === 'NO_KEY') {
          uni.showToast({ title: '未找到聊天密钥', icon: 'none' })
        } else {
          uni.showToast({ title: '导出失败：' + (e.message || '未知错误'), icon: 'none' })
        }
      } finally {
        this.exportLoading = false
      }
    },

    // 生成可读文件名
    generateFileName() {
      const now = new Date()
      const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      return `eye2_chat_backup_${d}.json`
    },

    // APP-PLUS: 保存文件（分平台）
    async saveAndShareFile(jsonStr) {
      const fileName = this.generateFileName()

      if (plus.os.name === 'Android') {
        await this.saveFileAndroid(jsonStr, fileName)
      } else {
        await this.saveFileIOS(jsonStr, fileName)
      }
    },

    // Android: 请求权限 → 保存到「下载」文件夹
    async saveFileAndroid(jsonStr, fileName) {
      const hasPermission = await this.requestStoragePermission()

      if (hasPermission) {
        try {
          const Environment = plus.android.importClass('android.os.Environment')
          const File = plus.android.importClass('java.io.File')
          const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')

          const downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
          // 确保目录存在
          if (!downloadsDir.exists()) {
            downloadsDir.mkdirs()
          }
          const targetFile = new File(downloadsDir, fileName)
          const fos = new FileOutputStream(targetFile)
          const bytes = plus.android.invoke(jsonStr, 'getBytes', 'UTF-8')
          fos.write(bytes)
          fos.flush()
          fos.close()

          // 通知媒体库扫描新文件（部分文件管理器需要）
          try {
            const MediaScannerConnection = plus.android.importClass('android.media.MediaScannerConnection')
            const context = plus.android.runtimeMainActivity()
            MediaScannerConnection.scanFile(context, [targetFile.getAbsolutePath()], ['application/json'], null)
          } catch (e) { /* 非致命 */ }

          this.showExportModal = false
          this.successTitle = '导出成功'
          this.successDesc = `备份文件已保存到「下载」文件夹\n文件名：${fileName}`
          this.showSuccess = true

          // 额外提供分享选项
          this.lastExportFilePath = targetFile.getAbsolutePath()
        } catch (e) {
          console.error('保存到下载目录失败，降级为分享:', e)
          await this.saveAndShareViaIntent(jsonStr, fileName)
        }
      } else {
        // 权限被拒，降级为分享面板
        await this.saveAndShareViaIntent(jsonStr, fileName)
      }
    },

    // iOS: 保存到沙箱 → 触发分享面板
    saveFileIOS(jsonStr, fileName) {
      return new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL('_doc/', (dirEntry) => {
          dirEntry.getFile(fileName, { create: true }, (fileEntry) => {
            fileEntry.createWriter((writer) => {
              writer.onwrite = () => {
                this.showExportModal = false
                const savedPath = fileEntry.toLocalURL()
                // 触发分享面板，用户可选择「存储到文件」
                if (plus.share && plus.share.sendWithSystem) {
                  plus.share.sendWithSystem(
                    { type: 'file', content: '聊天数据备份', href: savedPath },
                    () => {
                      this.successTitle = '导出成功'
                      this.successDesc = '备份文件已发送，请妥善保管'
                      this.showSuccess = true
                      resolve()
                    },
                    () => {
                      this.successTitle = '导出成功'
                      this.successDesc = '请在分享面板中选择「存储到文件」保存备份'
                      this.showSuccess = true
                      resolve()
                    }
                  )
                } else {
                  this.successTitle = '导出成功'
                  this.successDesc = '备份文件已保存，可通过 iTunes 文件共享获取'
                  this.showSuccess = true
                  resolve()
                }
              }
              writer.onerror = (e) => {
                uni.showToast({ title: '文件保存失败', icon: 'none' })
                reject(e)
              }
              writer.write(jsonStr)
            }, reject)
          }, reject)
        }, reject)
      })
    },

    // Android 降级方案：先写 _doc/ 再分享
    saveAndShareViaIntent(jsonStr, fileName) {
      return new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL('_doc/', (dirEntry) => {
          dirEntry.getFile(fileName, { create: true }, (fileEntry) => {
            fileEntry.createWriter((writer) => {
              writer.onwrite = () => {
                this.showExportModal = false
                const savedPath = fileEntry.toLocalURL()
                if (plus.share && plus.share.sendWithSystem) {
                  plus.share.sendWithSystem(
                    { type: 'file', content: '聊天数据备份', href: savedPath },
                    () => {
                      this.successTitle = '导出成功'
                      this.successDesc = '请在分享面板中选择保存位置'
                      this.showSuccess = true
                      resolve()
                    },
                    () => {
                      this.successTitle = '导出成功'
                      this.successDesc = '请在分享面板中选择保存位置'
                      this.showSuccess = true
                      resolve()
                    }
                  )
                } else {
                  this.successTitle = '导出成功'
                  this.successDesc = '备份文件已保存到应用内部目录'
                  this.showSuccess = true
                  resolve()
                }
              }
              writer.onerror = (e) => {
                uni.showToast({ title: '文件保存失败', icon: 'none' })
                reject(e)
              }
              writer.write(jsonStr)
            }, reject)
          }, reject)
        }, reject)
      })
    },

    // 请求 Android 存储权限
    requestStoragePermission() {
      return new Promise((resolve) => {
        if (plus.os.name !== 'Android') {
          resolve(true)
          return
        }
        plus.android.requestPermissions(
          ['android.permission.WRITE_EXTERNAL_STORAGE'],
          (result) => {
            if (result.deniedAlways && result.deniedAlways.length > 0) {
              uni.showModal({
                title: '需要存储权限',
                content: '保存备份文件到「下载」文件夹需要存储权限，请前往系统设置中手动开启。',
                confirmText: '去设置',
                cancelText: '使用分享',
                success: (res) => {
                  if (res.confirm) {
                    plus.runtime.openURL('app-settings:')
                  }
                  resolve(false)
                },
              })
            } else if (result.granted && result.granted.length > 0) {
              resolve(true)
            } else {
              resolve(false)
            }
          },
          () => resolve(false)
        )
      })
    },

    // ========== 导入 ==========
    startImport() {
      // #ifdef APP-PLUS
      this.pickFileAppPlus()
      // #endif

      // #ifndef APP-PLUS
      this.pickFileClipboard()
      // #endif
    },

    // APP-PLUS: 选择文件（分平台）
    pickFileAppPlus() {
      if (plus.os.name === 'Android') {
        this.pickFileAndroid()
      } else {
        this.pickFileIOS()
      }
    },

    // Android: 使用系统文件选择器 Intent
    pickFileAndroid() {
      try {
        const Intent = plus.android.importClass('android.content.Intent')
        const intent = new Intent(Intent.ACTION_GET_CONTENT)
        intent.setType('*/*')
        intent.addCategory(Intent.CATEGORY_OPENABLE)

        const main = plus.android.runtimeMainActivity()
        const requestCode = 10086

        // 注册结果监听（一次性）
        const listener = (data) => {
          plus.globalEvent.removeEventListener('onNewIntent', listener)
          // 用 onActivityResult 回调
        }

        main.startActivityForResult(
          Intent.createChooser(intent, '选择备份文件'),
          requestCode,
          // UniApp 中使用回调方式监听 onActivityResult
        )

        // 监听 Activity 返回结果
        const resultListener = (e) => {
          if (e.requestCode === requestCode) {
            plus.globalEvent.removeEventListener('onActivityResult', resultListener)
            if (e.resultCode === -1 && e.data) {
              // RESULT_OK = -1
              const uri = e.data.getData()
              if (uri) {
                this.readFileFromUri(uri)
                return
              }
            }
            // 用户取消或无数据
          }
        }
        plus.globalEvent.addEventListener('onActivityResult', resultListener, false)
      } catch (e) {
        console.error('Intent 文件选择失败，降级:', e)
        this.pickFileFallback()
      }
    },

    // Android: 从 Uri 读取文件内容
    readFileFromUri(uri) {
      try {
        const main = plus.android.runtimeMainActivity()
        const ContentResolver = plus.android.importClass('android.content.ContentResolver')
        const InputStreamReader = plus.android.importClass('java.io.InputStreamReader')
        const BufferedReader = plus.android.importClass('java.io.BufferedReader')
        const StringBuilder = plus.android.importClass('java.lang.StringBuilder')

        const resolver = main.getContentResolver()
        const inputStream = resolver.openInputStream(uri)
        const reader = new BufferedReader(new InputStreamReader(inputStream, 'UTF-8'))

        const sb = new StringBuilder()
        let line = reader.readLine()
        while (line !== null) {
          sb.append(line)
          sb.append('\n')
          line = reader.readLine()
        }
        reader.close()
        inputStream.close()

        const content = sb.toString()
        if (content) {
          this.parseImportData(content)
        } else {
          uni.showToast({ title: '文件内容为空', icon: 'none' })
        }
      } catch (e) {
        console.error('读取文件 Uri 失败:', e)
        uni.showToast({ title: '文件读取失败', icon: 'none' })
      }
    },

    // iOS: 使用 plus.io.chooseFile 或 document picker
    pickFileIOS() {
      // iOS 上 plus.io.chooseFile 会打开系统文件选择器
      plus.io.chooseFile(
        { multiple: false, filter: 'file' },
        (e) => {
          if (e && e.files && e.files.length > 0) {
            this.readImportFile(e.files[0])
          }
        },
        () => {
          this.pickFileFallback()
        }
      )
    },

    // 降级方案：plus.io.chooseFile
    pickFileFallback() {
      plus.io.chooseFile(
        { multiple: false, filter: 'file' },
        (e) => {
          if (e && e.files && e.files.length > 0) {
            this.readImportFile(e.files[0])
          }
        },
        () => {
          // 最终降级到剪贴板
          this.pickFileClipboard()
        }
      )
    },

    // 通过 plus.io 读取本地文件路径
    readImportFile(filePath) {
      plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
        entry.file((file) => {
          const reader = new plus.io.FileReader()
          reader.onloadend = (e) => {
            this.parseImportData(e.target.result)
          }
          reader.onerror = () => {
            uni.showToast({ title: '文件读取失败', icon: 'none' })
          }
          reader.readAsText(file, 'utf-8')
        }, () => {
          uni.showToast({ title: '文件读取失败', icon: 'none' })
        })
      }, () => {
        uni.showToast({ title: '文件路径无效', icon: 'none' })
      })
    },

    // 非APP环境：从剪贴板粘贴
    pickFileClipboard() {
      uni.getClipboardData({
        success: (res) => {
          if (res.data) {
            this.parseImportData(res.data)
          } else {
            uni.showToast({ title: '剪贴板为空，请先复制备份数据', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '无法读取剪贴板', icon: 'none' })
        },
      })
    },

    parseImportData(dataStr) {
      try {
        const bundle = JSON.parse(dataStr)
        const validation = validateBundle(bundle)
        if (!validation.valid) {
          uni.showToast({ title: validation.error || '文件格式无效', icon: 'none' })
          return
        }
        this.importBundle = bundle
        this.importPassword = ''
        this.importError = ''
        this.showImportPassword = false

        // 如果已有密钥，先弹确认框
        if (hasStoredKey()) {
          this.$refs.overwriteDialog.open()
        } else {
          this.showImportModal = true
        }
      } catch (e) {
        uni.showToast({ title: '文件格式无效，请选择正确的备份文件', icon: 'none' })
      }
    },

    confirmOverwriteImport() {
      this.showImportModal = true
    },

    closeImportModal() {
      if (this.importLoading) return
      this.showImportModal = false
      this.importBundle = null
    },

    async doImport() {
      if (!this.canImport) return
      this.importLoading = true
      this.importError = ''
      try {
        const userInfo = getUserInfo()
        if (!userInfo || !userInfo.id) {
          uni.showToast({ title: '用户未登录', icon: 'none' })
          return
        }

        importKeyBundle(this.importBundle, this.importPassword, userInfo.id)

        // 清除内存中的旧密钥缓存，下次进入聊天时会重新加载
        clearAllKeys()

        this.showImportModal = false
        this.hasKey = true
        this.successTitle = '导入成功'
        this.successDesc = '聊天密钥已恢复，请重新进入聊天页面查看历史消息'
        this.showSuccess = true
      } catch (e) {
        const errorMap = {
          'WRONG_PASSWORD': '密码错误，请重试',
          'USER_MISMATCH': '此备份文件不属于当前登录的账号',
          'INVALID_FORMAT': '文件格式无效',
          'INVALID_KEY_DATA': '备份数据已损坏',
        }
        this.importError = errorMap[e.message] || ('导入失败：' + (e.message || '未知错误'))
      } finally {
        this.importLoading = false
      }
    },

    closeSuccess() {
      this.showSuccess = false
    },
  },
}
</script>

<style lang="scss" scoped>
// ==================== 颜色变量 ====================
$light-bg-base: #fafbfd;
$light-bg-card: #ffffff;
$light-text-primary: #1a1a1a;
$light-text-secondary: #666666;
$light-text-muted: #999999;
$light-border: rgba(0, 0, 0, 0.08);
$light-accent: #1e3a5f;

$dark-bg-deep: #0a1628;
$dark-bg-mid: #122640;
$dark-bg-light: #1a365d;
$dark-text-light: #f0f6fc;
$dark-text-muted: rgba(240, 246, 252, 0.6);
$dark-glass-bg: rgba(255, 255, 255, 0.06);
$dark-glass-border: rgba(255, 255, 255, 0.1);

$accent-primary: #1e3a5f;
$accent-gradient: linear-gradient(135deg, #1e3a5f 0%, #4a90d9 100%);
$color-success: #10b981;
$color-warning: #f59e0b;
$color-error: #ef4444;
$color-export: #06b6d4;
$color-import: #8b5cf6;

.page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: $light-bg-base;
}

// ==================== 背景层 ====================
.bg-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, #e8f4fd 0%, $light-bg-base 100%);
}

.particles {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  opacity: 0;
}

.particle {
  position: absolute;
  width: 4rpx; height: 4rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: float-particle 10s ease-in-out infinite;

  &--1 { left: 20%; top: 17%; animation-delay: -1.2s; animation-duration: 9s; }
  &--2 { left: 30%; top: 29%; animation-delay: -2.4s; animation-duration: 10s; }
  &--3 { left: 40%; top: 41%; animation-delay: -3.6s; animation-duration: 11s; }
  &--4 { left: 50%; top: 53%; animation-delay: -4.8s; animation-duration: 12s; }
  &--5 { left: 60%; top: 65%; animation-delay: -6s; animation-duration: 13s; }
  &--6 { left: 70%; top: 77%; animation-delay: -7.2s; animation-duration: 14s; }
  &--7 { left: 80%; top: 89%; animation-delay: -8.4s; animation-duration: 15s; }
  &--8 { left: 90%; top: 100%; animation-delay: -9.6s; animation-duration: 16s; }
}

@keyframes float-particle {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  50% { transform: translateY(-40rpx) translateX(20rpx); opacity: 0.7; }
}

// ==================== 内容区 ====================
.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.status-bar { flex-shrink: 0; }

.navbar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 32rpx;
  opacity: 0;
  transform: translateY(-20rpx);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &--visible { opacity: 1; transform: translateY(0); }

  &__back {
    width: 72rpx; height: 72rpx;
    display: flex; align-items: center; justify-content: center;
  }
  &__title {
    flex: 1; text-align: center;
    font-size: 34rpx; font-weight: 600;
    color: $light-text-primary;
    letter-spacing: 2rpx;
  }
  &__placeholder { width: 72rpx; }
}

.back-icon {
  width: 20rpx; height: 20rpx;
  border-left: 3rpx solid $light-text-primary;
  border-bottom: 3rpx solid $light-text-primary;
  transform: rotate(45deg);
  margin-left: 8rpx;
}

.scroll-area {
  flex: 1;
  padding: 0 32rpx;
  box-sizing: border-box;
  width: 100%;
}

.section--visible {
  animation: section-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) var(--delay, 0s) both;
}

@keyframes section-in {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

// ==================== Hero 图标 ====================
.hero-section {
  display: flex;
  justify-content: center;
  padding: 48rpx 0 32rpx;
}

.hero-icon {
  position: relative;
  width: 140rpx; height: 140rpx;
  display: flex; align-items: center; justify-content: center;
}

.shield {
  position: relative;
  animation: shield-breathe 3s ease-in-out infinite;
}

@keyframes shield-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

.shield-body {
  width: 80rpx; height: 96rpx;
  background: $accent-gradient;
  border-radius: 12rpx 12rpx 40rpx 40rpx;
  position: relative;
  box-shadow: 0 12rpx 32rpx rgba(30, 58, 95, 0.35);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
    border-radius: 12rpx 12rpx 0 0;
  }
}

.shield-glow {
  position: absolute;
  top: -20rpx; left: -20rpx; right: -20rpx; bottom: -20rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 144, 217, 0.15) 0%, transparent 70%);
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.shield-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.arrow {
  width: 0; height: 0;

  &--up {
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-bottom: 14rpx solid rgba(255, 255, 255, 0.9);
    animation: arrow-up 2s ease-in-out infinite;
  }
  &--down {
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-top: 14rpx solid rgba(255, 255, 255, 0.9);
    animation: arrow-down 2s ease-in-out infinite;
  }
}

@keyframes arrow-up {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-4rpx); opacity: 1; }
}

@keyframes arrow-down {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(4rpx); opacity: 1; }
}

// ==================== 信息卡片 ====================
.info-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 28rpx 32rpx;
  background: rgba(6, 182, 212, 0.06);
  border: 1rpx solid rgba(6, 182, 212, 0.15);
  border-radius: 20rpx;
  margin-bottom: 32rpx;

  &__badge {
    width: 36rpx; height: 36rpx;
    border-radius: 50%;
    background: $color-export;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    margin-top: 2rpx;
  }
  &__badge-text {
    font-size: 22rpx; font-weight: 700;
    color: #fff; font-style: italic;
  }
  &__text {
    font-size: 26rpx;
    color: $light-text-secondary;
    line-height: 1.7;
  }
}

// ==================== 操作卡片 ====================
.action-section {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
  background: $light-bg-card;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;

  &:active:not(.action-card--disabled) {
    transform: scale(0.98);
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }

  &--disabled {
    opacity: 0.55;
  }

  &__accent {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 6rpx;
    border-radius: 6rpx 0 0 6rpx;

    &--export { background: $color-export; }
    &--import { background: $color-import; }
  }

  &__icon {
    width: 80rpx; height: 80rpx;
    border-radius: 20rpx;
    display: flex; align-items: center; justify-content: center;
    margin-right: 24rpx;
    flex-shrink: 0;

    &--export {
      background: rgba(6, 182, 212, 0.1);
    }
    &--import {
      background: rgba(139, 92, 246, 0.1);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: $light-text-primary;
    margin-bottom: 6rpx;
  }

  &__desc {
    display: block;
    font-size: 24rpx;
    color: $light-text-secondary;
    line-height: 1.5;

    &--muted {
      color: $light-text-muted;
    }
  }

  &__arrow {
    width: 16rpx; height: 16rpx;
    border-right: 3rpx solid $light-text-muted;
    border-bottom: 3rpx solid $light-text-muted;
    transform: rotate(-45deg);
    margin-left: 16rpx;
    flex-shrink: 0;
  }
}

// 导出图标 - 向上箭头
.export-arrow {
  width: 4rpx; height: 28rpx;
  background: $color-export;
  position: relative;
  border-radius: 2rpx;

  &::before {
    content: '';
    position: absolute;
    top: -2rpx; left: 50%;
    transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-bottom: 12rpx solid $color-export;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -6rpx; left: 50%;
    transform: translateX(-50%);
    width: 24rpx; height: 4rpx;
    background: $color-export;
    border-radius: 2rpx;
  }
}

// 导入图标 - 向下箭头
.import-arrow {
  width: 4rpx; height: 28rpx;
  background: $color-import;
  position: relative;
  border-radius: 2rpx;

  &::before {
    content: '';
    position: absolute;
    bottom: -2rpx; left: 50%;
    transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-top: 12rpx solid $color-import;
  }
  &::after {
    content: '';
    position: absolute;
    top: -6rpx; left: 50%;
    transform: translateX(-50%);
    width: 24rpx; height: 4rpx;
    background: $color-import;
    border-radius: 2rpx;
  }
}

// ==================== 安全提示 ====================
.security-note {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 0 8rpx;

  &__icon {
    width: 24rpx; height: 24rpx;
    border: 2rpx solid $light-text-muted;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
    margin-top: 4rpx;

    &::after {
      content: '!';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18rpx;
      font-weight: 700;
      color: $light-text-muted;
      line-height: 1;
    }
  }

  &__text {
    font-size: 22rpx;
    color: $light-text-muted;
    line-height: 1.6;
  }
}

.bottom-space {
  height: calc(60rpx + env(safe-area-inset-bottom));
}

// ==================== 底部弹窗 ====================
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &--show {
    opacity: 1;
    visibility: visible;

    .modal__sheet {
      transform: translateY(0);
    }
  }

  &__overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
  }

  &__sheet {
    position: relative;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    background: $light-bg-card;
    border-radius: 32rpx 32rpx 0 0;
    padding: 0 40rpx;
    padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
    transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 36rpx 0 24rpx;
  }

  &__title {
    font-size: 34rpx;
    font-weight: 600;
    color: $light-text-primary;
  }

  &__close {
    width: 56rpx; height: 56rpx;
    display: flex; align-items: center; justify-content: center;
    margin-right: -12rpx;
  }

  &__body {
    padding-bottom: 16rpx;
  }

  &__footer {
    padding: 8rpx 0 16rpx;
  }
}

.close-x {
  width: 24rpx; height: 24rpx;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%; left: 0;
    width: 100%; height: 3rpx;
    background: $light-text-muted;
    border-radius: 2rpx;
  }
  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
}

// ==================== 表单元素 ====================
.input-group {
  padding: 20rpx 0;
  border-bottom: 1rpx solid $light-border;

  &--last { border-bottom: none; }
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: $light-text-muted;
  margin-bottom: 16rpx;
  letter-spacing: 1rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &--focus {
    background: rgba(30, 58, 95, 0.05);
    border-color: rgba(30, 58, 95, 0.3);
    box-shadow: 0 0 0 4rpx rgba(30, 58, 95, 0.1);
  }
  &--error {
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.05);
  }
  &--success {
    border-color: rgba(16, 185, 129, 0.5);
    background: rgba(16, 185, 129, 0.05);
  }
}

.input-field {
  flex: 1; height: 100%;
  font-size: 30rpx;
  color: $light-text-primary;
}

.input-placeholder { color: $light-text-muted; }

.eye-toggle {
  width: 60rpx; height: 60rpx;
  display: flex; align-items: center; justify-content: center;
  margin-left: 8rpx;
}

.eye-icon {
  width: 40rpx; height: 40rpx;
  filter: invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(90%);
  transition: filter 0.3s ease;
}

// ==================== 密码强度 ====================
.strength-bar {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 16rpx;
}

.strength-track {
  flex: 1;
  height: 6rpx;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3rpx;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3rpx;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--weak { background: $color-error; }
  &--medium { background: $color-warning; }
  &--strong { background: $color-success; }
}

.strength-text {
  font-size: 22rpx;
  font-weight: 500;
  min-width: 40rpx;

  &--weak { color: $color-error; }
  &--medium { color: $color-warning; }
  &--strong { color: $color-success; }
}

// ==================== 密码匹配提示 ====================
.match-hint {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  gap: 8rpx;
}

.match-icon {
  width: 28rpx; height: 28rpx;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;

  &--success { background: rgba(16, 185, 129, 0.1); }
}

.check-mark {
  width: 12rpx; height: 8rpx;
  border-left: 2rpx solid $color-success;
  border-bottom: 2rpx solid $color-success;
  transform: rotate(-45deg);
  margin-top: -2rpx;
}

.cross-mark {
  width: 12rpx; height: 12rpx;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%; left: 0;
    width: 100%; height: 2rpx;
    background: $color-error;
  }
  &::before { transform: rotate(45deg); }
  &::after { transform: rotate(-45deg); }
}

.match-text {
  font-size: 22rpx;
  color: $color-error;

  &--success { color: $color-success; }
}

// 错误提示
.error-hint {
  margin-top: 12rpx;

  &__text {
    font-size: 24rpx;
    color: $color-error;
  }
}

// ==================== 导入文件信息 ====================
.import-file-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: rgba(139, 92, 246, 0.06);
  border: 1rpx solid rgba(139, 92, 246, 0.12);
  border-radius: 16rpx;
  margin-bottom: 24rpx;

  &__icon {
    width: 48rpx; height: 48rpx;
    border-radius: 12rpx;
    background: rgba(139, 92, 246, 0.12);
    position: relative;
    flex-shrink: 0;

    &::before {
      content: '';
      position: absolute;
      top: 12rpx; left: 14rpx;
      width: 20rpx; height: 24rpx;
      border: 2rpx solid $color-import;
      border-radius: 3rpx;
    }
    &::after {
      content: '';
      position: absolute;
      top: 10rpx; right: 12rpx;
      width: 0; height: 0;
      border-left: 8rpx solid $color-import;
      border-bottom: 8rpx solid transparent;
    }
  }

  &__detail { flex: 1; }

  &__name {
    display: block;
    font-size: 28rpx;
    font-weight: 500;
    color: $light-text-primary;
    margin-bottom: 4rpx;
  }

  &__date {
    display: block;
    font-size: 22rpx;
    color: $light-text-muted;
  }
}

// ==================== 模态按钮 ====================
.modal-btn {
  height: 96rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center; justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &--primary {
    background: $accent-gradient;
    box-shadow: 0 8rpx 24rpx rgba(30, 58, 95, 0.3);
  }

  &--primary:active:not(.modal-btn--disabled):not(.modal-btn--loading) {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(30, 58, 95, 0.4);
  }

  &--disabled {
    opacity: 0.5;
    box-shadow: none;
  }

  &--loading {
    pointer-events: none;
  }

  &__text {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 4rpx;
  }
}

.loading-spinner {
  width: 40rpx; height: 40rpx;
}

.spinner-ring {
  width: 100%; height: 100%;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ==================== 成功弹窗 ====================
.success-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center; justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &--show {
    opacity: 1;
    visibility: visible;

    .success-modal__content {
      transform: scale(1);
    }
  }

  &__overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
  }

  &__content {
    position: relative;
    width: 560rpx;
    background: $light-bg-card;
    border-radius: 32rpx;
    padding: 60rpx 40rpx 40rpx;
    text-align: center;
    transform: scale(0.8);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.success-icon {
  width: 120rpx; height: 120rpx;
  margin: 0 auto 32rpx;
  position: relative;
}

.success-circle {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: 4rpx solid $color-success;
  border-radius: 50%;
  animation: circle-draw 0.5s ease-out forwards;
}

@keyframes circle-draw {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.success-check {
  position: absolute;
  top: 50%; left: 50%;
  width: 40rpx; height: 24rpx;
  border-left: 6rpx solid $color-success;
  border-bottom: 6rpx solid $color-success;
  transform: translate(-50%, -60%) rotate(-45deg);
  animation: check-draw 0.3s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes check-draw {
  from { opacity: 0; transform: translate(-50%, -60%) rotate(-45deg) scale(0); }
  to { opacity: 1; transform: translate(-50%, -60%) rotate(-45deg) scale(1); }
}

.success-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: $light-text-primary;
  margin-bottom: 16rpx;
}

.success-desc {
  display: block;
  font-size: 26rpx;
  color: $light-text-muted;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.success-btn {
  height: 88rpx;
  background: $accent-gradient;
  border-radius: 16rpx;
  display: flex;
  align-items: center; justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(30, 58, 95, 0.25);
  transition: all 0.2s ease;

  &:active { transform: scale(0.98); }

  &__text {
    font-size: 30rpx;
    font-weight: 500;
    color: #fff;
    letter-spacing: 2rpx;
  }
}

// ==================== 深色模式 ====================
.page--dark {
  background: $dark-bg-deep;

  .bg-gradient {
    background: linear-gradient(165deg, $dark-bg-deep 0%, $dark-bg-mid 50%, $dark-bg-light 100%);
  }

  .particles { opacity: 1; }

  .navbar__title { color: $dark-text-light; }
  .back-icon { border-color: $dark-text-light; }

  // Hero
  .shield-body {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
  }
  .shield-glow {
    background: radial-gradient(circle, rgba(74, 144, 217, 0.25) 0%, transparent 70%);
  }

  // 信息卡片
  .info-card {
    background: rgba(6, 182, 212, 0.08);
    border-color: rgba(6, 182, 212, 0.2);

    &__text { color: $dark-text-muted; }
  }

  // 操作卡片
  .action-card {
    background: $dark-glass-bg;
    border: 1rpx solid $dark-glass-border;
    box-shadow: none;
    backdrop-filter: blur(20px);

    &__title { color: $dark-text-light; }
    &__desc { color: $dark-text-muted; }
    &__desc--muted { color: rgba(240, 246, 252, 0.35); }
    &__arrow { border-color: $dark-text-muted; }

    &__icon--export { background: rgba(6, 182, 212, 0.15); }
    &__icon--import { background: rgba(139, 92, 246, 0.15); }
  }

  // 安全提示
  .security-note {
    &__icon {
      border-color: $dark-text-muted;
      &::after { color: $dark-text-muted; }
    }
    &__text { color: $dark-text-muted; }
  }

  // 弹窗
  .modal__sheet {
    background: $dark-bg-mid;
    border: 1rpx solid $dark-glass-border;
  }
  .modal__title { color: $dark-text-light; }
  .close-x::before, .close-x::after { background: $dark-text-muted; }

  .input-label { color: $dark-text-muted; }
  .input-wrapper {
    background: rgba(255, 255, 255, 0.05);

    &--focus {
      background: rgba(74, 144, 217, 0.1);
      border-color: rgba(74, 144, 217, 0.4);
      box-shadow: 0 0 0 4rpx rgba(74, 144, 217, 0.15);
    }
    &--error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.4);
    }
    &--success {
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.4);
    }
  }
  .input-field { color: $dark-text-light; }
  .input-placeholder { color: $dark-text-muted; }

  .eye-icon {
    filter: invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(95%) contrast(85%);
  }

  .strength-track { background: rgba(255, 255, 255, 0.1); }

  .match-icon {
    background: rgba(239, 68, 68, 0.15);
    &--success { background: rgba(16, 185, 129, 0.15); }
  }

  // 导入文件信息
  .import-file-info {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.2);

    &__icon { background: rgba(139, 92, 246, 0.2); }
    &__name { color: $dark-text-light; }
    &__date { color: $dark-text-muted; }
  }

  // 按钮
  .modal-btn--primary {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
    box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.3);
  }

  // 成功弹窗
  .success-modal__content {
    background: $dark-bg-mid;
    border: 1rpx solid $dark-glass-border;
  }
  .success-title { color: $dark-text-light; }
  .success-desc { color: $dark-text-muted; }
  .success-btn {
    background: linear-gradient(135deg, #4a90d9 0%, #6ba3e0 100%);
    box-shadow: 0 8rpx 20rpx rgba(74, 144, 217, 0.3);
  }
}
</style>
