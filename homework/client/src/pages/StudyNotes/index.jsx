import { useEffect, useState } from 'react'
import { Card, Spin } from 'antd'
import { marked } from 'marked'
import axios from 'axios'

const StudyNotes = () => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        const response = await axios.get('/api/readme')
        setContent(marked(response.data.content))
      } catch (error) {
        console.error('获取README失败:', error)
        setContent('<p>获取学习心得失败，请稍后再试</p>')
      } finally {
        setLoading(false)
      }
    }

    fetchReadme()
  }, [])

  return (
    <Card title="学习心得" bordered={false}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </Card>
  )
}

export default StudyNotes