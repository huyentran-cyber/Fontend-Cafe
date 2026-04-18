import { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from './api/api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State để ẩn/hiện mật khẩu
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear(); 
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/Auth/login', { email, password });
      
      const user = res.data.user;
      if (!user) throw new Error("Dữ liệu người dùng không hợp lệ");

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('role', user.role);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userPosition', user.position?.name || "Chưa xác định");

      onLoginSuccess(); 
      
      if (user.role === 'Manager') {
        navigate('/admin/employees');
      } else {
        navigate('/attendance');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Đăng nhập thất bại! Kiểm tra tài khoản/mật khẩu.");
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Card className="shadow-lg p-4" style={{ width: '400px', borderRadius: '15px', border: 'none' }}>
        <h3 className="text-center mb-4 text-primary fw-bold">☕ COFFEE ERP</h3>
        
        {error && <Alert variant="danger" className="py-2 small text-center">{error}</Alert>}
        
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Tài khoản</Form.Label>
            <Form.Control 
              type="email" 
              placeholder="Nhập email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Mật khẩu</Form.Label>
            <InputGroup>
              <Form.Control 
                type={showPassword ? "text" : "password"} // Thay đổi type dựa trên state
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"} {/* Icon con mắt hoặc khỉ che mắt */}
              </Button>
            </InputGroup>
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                ĐANG XỬ LÝ...
              </>
            ) : (
              'ĐĂNG NHẬP'
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Login;