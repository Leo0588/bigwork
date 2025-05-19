import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Modal, message, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import axios from 'axios'
import QuestionForm from '../../components/QuestionForm'
import AIGenerate from '../../components/AIGenerate'

const { Option } = Select

const QuestionBank = () => {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    type: 'all',
    keyword: ''
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [formVisible, setFormVisible] = useState(false)
  const [aiVisible, setAiVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [addType, setAddType] = useState('manual')

  // 获取题目列表
  const fetchQuestions = async (params = {}) => {
    setLoading(true)
    try {
      const { current, pageSize } = pagination
      const { type, keyword } = filters
      const response = await axios.get('/api/questions', {
        params: {
          page: params.page || current,
          pageSize: params.pageSize || pageSize,
          type: type === 'all' ? undefined : type,
          keyword
        }
      })
      
      setQuestions(response.data.data)
      setPagination({
        ...pagination,
        current: params.page || current,
        total: response.data.total
      })
    } catch (error) {
      console.error('获取题目列表失败:', error)
      message.error('获取题目列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'single': '单选题',
          'multiple': '多选题',
          'programming': '编程题'
        }
        return typeMap[type] || type
      }
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      render: () => '段光雷' // 根据需求忽略创建人字段，使用固定值
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个题目吗？"
            onConfirm={() => handleDelete([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 处理表格变化
  const handleTableChange = (pagination) => {
    fetchQuestions({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  // 处理筛选变化
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // 重置到第一页
    const newPagination = { ...pagination, current: 1 };
    setPagination(newPagination);
    
    // 立即获取筛选后的数据
    fetchQuestions({
      page: 1,
      pageSize: newPagination.pageSize,
      type: newFilters.type === 'all' ? undefined : newFilters.type,
      keyword: newFilters.keyword
    });
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchQuestions({ page: 1 })
  }

  // 处理编辑
  const handleEdit = (question) => {
    setCurrentQuestion(question)
    setFormVisible(true)
  }

  // 处理删除
  const handleDelete = async (ids) => {
    try {
      await axios.post('/api/questions/delete', { ids })
      message.success('删除成功')
      fetchQuestions()
      setSelectedRowKeys([])
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的题目')
      return
    }
    handleDelete(selectedRowKeys)
  }

  // 处理表单提交
  const handleFormSubmit = async (values) => {
    try {
      setLoading(true); // 添加加载状态
      
      // 根据题型验证必填字段
      if (values.type === 'programming') {
        if (!values.language) {
          message.error('编程题必须选择编程语言');
          return;
        }
        // 编程题不需要选项，但需要答案
        if (!values.title || !values.answer || !values.difficulty) {
          message.error('请填写完整的题目信息');
          return;
        }
      } else {
        // 选择题需要验证选项和答案
        if (!values.title || !values.optionA || !values.optionB || !values.optionC || !values.optionD || !values.answer || !values.difficulty) {
          message.error('请填写完整的题目信息');
          return;
        }
      }
      
      if (currentQuestion) {
        // 编辑
        await axios.put(`/api/questions/${currentQuestion.id}`, values);
        message.success('编辑成功');
      } else {
        // 新增
        await axios.post('/api/questions', values);
        message.success('添加成功');
      }
      setFormVisible(false);
      setCurrentQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false); // 无论成功失败都关闭加载状态
    }
  };

  // 处理出题按钮点击
  const handleAddClick = () => {
    Modal.confirm({
      title: '选择出题方式',
      content: (
        <div>
          <Tabs
            centered
            defaultActiveKey="manual"
            activeKey={addType}
            onChange={(key) => {
              setAddType(key);
            }}
            items={[
              {
                key: 'manual',
                label: '自主出题',
              }, 
              {
                key: 'ai',
                label: 'AI出题',
              }
            ]}
          />
        </div>
      ),
      onOk: () => {
        if (addType === 'manual') {
          setCurrentQuestion(null);
          setFormVisible(true);
        } else {
          setAiVisible(true);
        }
      },
      okText: '确定',
      cancelText: '取消',
      width: 400
    });
  };

  // 处理AI生成的题目保存
  const handleAIQuestionsSave = async (questions) => {
    try {
      await axios.post('/api/questions/batch', { questions })
      message.success('添加成功')
      setAiVisible(false)
      fetchQuestions()
    } catch (error) {
      console.error('添加失败:', error)
      message.error('添加失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Select
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="single">单选题</Option>
            <Option value="multiple">多选题</Option>
            <Option value="programming">编程题</Option>
          </Select>
          <Input
            placeholder="请输入关键词"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined />}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddClick}
          >
            出题
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 个题目吗？`}
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={columns}
        dataSource={questions}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      {/* 题目表单 */}
      <QuestionForm
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false)
          setCurrentQuestion(null)
        }}
        onSubmit={handleFormSubmit}
        initialValues={currentQuestion}
      />

      {/* AI生成题目 */}
      <AIGenerate
        visible={aiVisible}
        onCancel={() => setAiVisible(false)}
        onSave={handleAIQuestionsSave}
      />
    </div>
  )
}

export default QuestionBank