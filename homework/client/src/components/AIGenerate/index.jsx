import { useState } from 'react'
import { Modal, Form, Select, InputNumber, Button, Card, Checkbox, message, Spin } from 'antd'
import axios from 'axios'

const { Option } = Select

const AIGenerate = ({ visible, onCancel, onSave }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [previewVisible, setPreviewVisible] = useState(false)

  // 生成题目
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      
      setLoading(true)
      const response = await axios.post('/api/ai/generate', values)
      
      if (response.data.code === 0 && response.data.data) {
        setQuestions(response.data.data)
        setPreviewVisible(true)
      } else {
        message.error(response.data.message || '生成题目失败')
      }
    } catch (error) {
      console.error('生成题目失败:', error)
      message.error(error.response?.data?.message || '生成题目失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理选择题目
  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId)
      } else {
        return [...prev, questionId]
      }
    })
  }

  // 保存选中的题目
  const handleSaveQuestions = () => {
    if (selectedQuestions.length === 0) {
      message.warning('请至少选择一个题目')
      return
    }
    
    const selectedItems = questions.filter(q => selectedQuestions.includes(q.id))
    onSave(selectedItems)
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
    setQuestions([])
    setSelectedQuestions([])
    setPreviewVisible(false)
  }

  const handleCancel = () => {
    handleReset()
    onCancel()
  }

  return (
    <Modal
      title="AI生成题目"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
    >
      <Form form={form} layout="inline" initialValues={{ type: 'single', count: 3, language: 'go' }}>
        <Form.Item
          name="type"
          label="题型"
          rules={[{ required: true, message: '请选择题型' }]}
        >
          <Select style={{ width: 120 }}>
            <Option value="single">单选题</Option>
            <Option value="multiple">多选题</Option>
            <Option value="programming">编程题</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="count"
          label="题目数量"
          rules={[{ required: true, message: '请输入题目数量' }]}
        >
          <InputNumber min={1} max={10} style={{ width: 80 }} />
        </Form.Item>

        <Form.Item
          name="language"
          label="编程语言"
          rules={[{ required: true, message: '请选择编程语言' }]}
        >
          <Select style={{ width: 120 }}>
            <Option value="go">Go语言</Option>
            <Option value="javascript">JavaScript</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleGenerate} loading={loading}>
            生成并预览题库
          </Button>
        </Form.Item>
      </Form>

      {loading && (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <Spin tip="正在生成题目..." />
        </div>
      )}

      {previewVisible && questions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>AI生成区域</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 16 }}>
            {questions.map(question => (
              <Card 
                key={question.id} 
                style={{ marginBottom: 16 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {question.type === 'single' ? '单选题' : 
                       question.type === 'multiple' ? '多选题' : '编程题'}
                    </span>
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleSelectQuestion(question.id)}
                    />
                  </div>
                }
              >
                <p><strong>题目：</strong>{question.title}</p>
                {(question.type === 'single' || question.type === 'multiple') && (
                  <div>
                    <p>A: {question.optionA}</p>
                    <p>B: {question.optionB}</p>
                    <p>C: {question.optionC}</p>
                    <p>D: {question.optionD}</p>
                    <p><strong>答案：</strong>{question.answer}</p>
                  </div>
                )}
                {question.type === 'programming' && (
                  <p><strong>编程语言：</strong>{question.language === 'go' ? 'Go语言' : 'JavaScript'}</p>
                )}
                <p><strong>难度：</strong>
                  {question.difficulty === 'easy' ? '简单' : 
                   question.difficulty === 'medium' ? '中等' : '困难'}
                </p>
              </Card>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" onClick={handleSaveQuestions}>添加到题库</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AIGenerate