import { Form, Input, Select, Modal, Radio, Checkbox, Row, Col, message } from 'antd'
import { useState, useEffect } from 'react'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input

const QuestionForm = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm()
  const [questionType, setQuestionType] = useState('single')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        answer: initialValues.type === 'multiple' 
          ? initialValues.answer.split(',') 
          : initialValues.answer
      })
      setQuestionType(initialValues.type)
    } else if (visible) {
      form.resetFields()
      setQuestionType('single')
    }
  }, [visible, initialValues, form])

  const handleTypeChange = (value) => {
    setQuestionType(value)
    form.setFieldsValue({
      answer: undefined,
      language: undefined
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // 处理多选题答案格式
      if (values.type === 'multiple' && Array.isArray(values.answer)) {
        values.answer = values.answer.join(',')
      }

      // 直接调用父组件传入的onSubmit函数，而不是自己发送请求
      onSubmit(values)
    } catch (error) {
      console.error('表单提交失败:', error)
      message.error('表单验证失败，请检查输入')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setQuestionType('single')
    onCancel()
  }

  return (
    <Modal
      title={initialValues ? '编辑题目' : '创建题目'}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: 'single' }}
      >
        <Form.Item
          name="type"
          label="题型"
          rules={[{ required: true, message: '请选择题型' }]}
        >
          <Select onChange={handleTypeChange}>
            <Option value="single">单选题</Option>
            <Option value="multiple">多选题</Option>
            <Option value="programming">编程题</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="language"
          label="编程语言"
          rules={[{ 
            required: questionType === 'programming', 
            message: '请选择编程语言' 
          }]}
          style={{ display: questionType === 'programming' ? 'block' : 'none' }}
        >
          <Select>
            <Option value="go">Go语言</Option>
            <Option value="javascript">JavaScript</Option>
            <Option value="python">Python</Option>
            <Option value="java">Java</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="题目"
          rules={[{ required: true, message: '请输入题目' }]}
        >
          <TextArea rows={4} placeholder="请输入题目内容" />
        </Form.Item>

        <Form.Item
          name="difficulty"
          label="难度"
          rules={[{ required: true, message: '请选择难度' }]}
        >
          <Select>
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
        </Form.Item>

        {questionType !== 'programming' && (
          <>
            <Form.Item
              name="optionA"
              label="选项A"
              rules={[{ required: true, message: '请输入选项A' }]}
            >
              <Input placeholder="请输入选项A" />
            </Form.Item>

            <Form.Item
              name="optionB"
              label="选项B"
              rules={[{ required: true, message: '请输入选项B' }]}
            >
              <Input placeholder="请输入选项B" />
            </Form.Item>

            <Form.Item
              name="optionC"
              label="选项C"
              rules={[{ required: true, message: '请输入选项C' }]}
            >
              <Input placeholder="请输入选项C" />
            </Form.Item>

            <Form.Item
              name="optionD"
              label="选项D"
              rules={[{ required: true, message: '请输入选项D' }]}
            >
              <Input placeholder="请输入选项D" />
            </Form.Item>

            <Form.Item
              name="answer"
              label="答案"
              rules={[{ required: true, message: '请选择正确答案' }]}
            >
              {questionType === 'single' ? (
                <Radio.Group>
                  <Radio value="A">A</Radio>
                  <Radio value="B">B</Radio>
                  <Radio value="C">C</Radio>
                  <Radio value="D">D</Radio>
                </Radio.Group>
              ) : (
                <Checkbox.Group>
                  <Row>
                    <Col span={6}><Checkbox value="A">A</Checkbox></Col>
                    <Col span={6}><Checkbox value="B">B</Checkbox></Col>
                    <Col span={6}><Checkbox value="C">C</Checkbox></Col>
                    <Col span={6}><Checkbox value="D">D</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              )}
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default QuestionForm