import { useEffect, useState } from 'react'
import { useApplicationsSheet, useSaveApplicationsSheet } from '../hooks/useApi'
import { Spinner } from '../components/ui'

export default function ApplicationsPage() {
  const { data, isLoading } = useApplicationsSheet()
  const saveSheet = useSaveApplicationsSheet()
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(data?.url || '')
  }, [data?.url])

  const openSheet = () => {
    if (!data?.url) return
    window.open(data.url, '_blank', 'noopener,noreferrer')
  }

  const handleSave = async () => {
    await saveSheet.mutateAsync(url)
  }

  return (
    <div>
      <div className="mb-8 lg:mb-12">
        <h1 className="mb-2 font-serif text-3xl text-maroon sm:text-4xl lg:text-5xl">Applications</h1>
        <p className="text-base text-charcoal-light opacity-80 sm:text-lg">Save your Google Sheet link and open it instantly.</p>
      </div>

      <div className="max-w-3xl rounded-3xl border border-taupe-light bg-white p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <>
            <label className="mb-2 block text-sm font-semibold text-charcoal">Google Sheet Link</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="w-full rounded-xl border-2 border-taupe-light bg-cream px-4 py-3 text-sm text-charcoal transition-all focus:border-gold focus:bg-white focus:outline-none"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saveSheet.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-maroon px-5 py-3 text-sm font-semibold text-cream shadow-lg shadow-maroon/30 transition-all hover:-translate-y-0.5 hover:bg-maroon-dark disabled:opacity-50"
              >
                <i className="fas fa-save" />
                {saveSheet.isPending ? 'Saving...' : 'Save Link'}
              </button>

              <button
                onClick={openSheet}
                disabled={!data?.url}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-taupe bg-white px-5 py-3 text-sm font-semibold text-maroon transition-all hover:border-maroon hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="fas fa-external-link-alt" />
                Open Sheet
              </button>
            </div>

            {data?.url && (
              <p className="mt-4 break-all text-xs text-charcoal-light">
                Current saved link: {data.url}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
