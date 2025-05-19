import { useState } from 'react'
import { Layout, Menu, Button, theme } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import './index.css'

const { Header, Sider, Content } = Layout

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer } } = theme.useToken()

  const menuItems = [
    {
      key: 'study-notes',
      label: '学习心得',
    },
    {
      key: 'question-bank',
      label: '题库管理',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(`/${key}`)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={200}>
        <div className="logo">金山办公 武汉科技大学 张三 大作业</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split('/')[1] || 'study-notes']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout