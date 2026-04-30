import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { router } from './router';
import { theme } from './styles/theme';
import './styles/global.less';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <Spin size="large" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </ConfigProvider>
  );
}

export default App;
