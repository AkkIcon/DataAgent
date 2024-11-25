import { NextPage } from 'next'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { Fragment } from 'react'
import { ComponentType } from 'react'
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

import { DocumentsProvider } from '@/hooks/useDocuments'
import { EnvironmentStatusProvider } from '@/hooks/useEnvironmentStatus'
import { WebsocketProvider } from '@/hooks/useWebsocket'
import '@/styles/globals.css'
import '@/styles/markdown.scss'
import '@/styles/highlingt-light.scss'
import 'simplebar-react/dist/simplebar.min.css'

import '../../scripts/wdyr'
import DndBackendProvider from '@/components/DndBackendProvider'
import { SideBarProvider } from '@/hooks/useSideBar'
import useProperties from '@/hooks/useProperties'
import Telemetry from '@/components/Telemetry'
import { DataSourcesProvider } from '@/hooks/useDatasources'
import { ReusableComponentsProvider } from '@/hooks/useReusableComponents'
import { CommentsProvider } from '@/hooks/useComments'
import { ChatLayoutProvider } from '@/components/mf/ChatLayout'

type Page<P = {}> = NextPage<P> & {
  layout?: ComponentType
}

type Props = AppProps & {
  Component: Page
}

function App({ Component, pageProps: { session, ...pageProps } }: Props) {
  const Layout = Component.layout ?? Fragment

  const properties = useProperties()
  const telemetryEnabled = !(properties.data?.disabledAnonymousTelemetry ?? true)

  return (
    <PostHogProvider client={posthog}>
      {telemetryEnabled && <Telemetry />}
      <DndBackendProvider>
        <WebsocketProvider>
          <EnvironmentStatusProvider>
            <DocumentsProvider>
              <CommentsProvider>
                <DataSourcesProvider>
                  <ReusableComponentsProvider>
                    <SideBarProvider>
                      <ChatLayoutProvider>
                        <Layout>
                          <Component {...pageProps} />
                        </Layout>
                      </ChatLayoutProvider>
                    </SideBarProvider>
                  </ReusableComponentsProvider>
                </DataSourcesProvider>
              </CommentsProvider>
            </DocumentsProvider>
          </EnvironmentStatusProvider>
        </WebsocketProvider>
      </DndBackendProvider>
    </PostHogProvider>
  )
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
})
