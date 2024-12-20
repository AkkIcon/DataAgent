import { useStringQuery } from '@/hooks/useQueryArgs'
import { SessionUser, useSession } from '@/hooks/useAuth'
import useDocument from '@/hooks/useDocument'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { UserWorkspaceRole } from '@briefer/database'
import { ContentSkeleton, TitleSkeleton } from '@/components/v2Editor/ContentSkeleton'
import WorkspaceLayout from '@/components/WorkspaceLayout'
import clsx from 'clsx'
import { widthClasses } from '@/components/v2Editor/constants'

export default function DocumentPage() {
  const session = useSession()
  const workspaceId = useStringQuery('workspaceId')
  const documentId = useStringQuery('documentId')
  const role = session.data?.roles[workspaceId]
  const router = useRouter()

  useEffect(() => {
    if (!role && !session.isLoading) {
      router.replace(`/workspaces/${workspaceId}/documents`)
    }
  }, [role, session.isLoading, workspaceId, router])

  if (!session.data && session.isLoading && !session.error) {
    return (
      <div className="flex w-full justify-center">
        <div className={clsx(widthClasses, 'py-20')}>
          <TitleSkeleton visible />
          <ContentSkeleton visible />
        </div>
      </div>
    )
  }

  if (session.data && role) {
    return (
      <PrivateDocumentPage
        workspaceId={workspaceId}
        documentId={documentId}
        user={session.data}
        role={role}
      />
    )
  }

  return null
}

DocumentPage.layout = WorkspaceLayout
interface PrivateDocumentPageProps {
  workspaceId: string
  documentId: string
  user: SessionUser
  role: UserWorkspaceRole
}
function PrivateDocumentPage(props: PrivateDocumentPageProps) {
  const [{ document, loading }] = useDocument(props.workspaceId, props.documentId)
  const router = useRouter()

  useEffect(() => {
    if (loading) {
      return
    }

    if (!document) {
      router.replace(`/workspaces/${props.workspaceId}${window.location.search}`)
      return
    }

    if (document.publishedAt === null) {
      router.replace(
        `/workspaces/${props.workspaceId}/documents/${props.documentId}/notebook/edit${window.location.search}`
      )
    }

    if (document.hasDashboard) {
      router.replace(`/workspaces/${props.workspaceId}/documents/${props.documentId}/dashboard`)
    } else {
      router.replace(
        `/workspaces/${props.workspaceId}/documents/${props.documentId}/notebook${window.location.search}`
      )
    }
  }, [document, loading, props.user])

  return (
    <div className="flex w-full justify-center">
      <div className={clsx(widthClasses, 'py-20')}>
        <TitleSkeleton visible />
        <ContentSkeleton visible />
      </div>
    </div>
  )
}
