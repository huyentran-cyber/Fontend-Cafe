import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Badge, Spinner, Alert, Table, Form } from 'react-bootstrap';
import api from '../../api/api';

function MySalary() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const employeeId = localStorage.getItem('userId');
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    const fetchSalary = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/Salary/my-history/${employeeId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        
        const filteredData = data.filter(s => 
          s.month === parseInt(filter.month) && 
          s.year === parseInt(filter.year)
        );
        
        setHistories(filteredData);
      } catch (err) {
        console.error("Lỗi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, [employeeId, filter]);

  if (!employeeId) return <Container className="mt-5"><Alert variant="danger">Vui lòng đăng nhập!</Alert></Container>;

  return (
    <Container className="mt-4 pb-5">
      {/* KHỐI BỘ LỌC */}
      <Card className="shadow-sm border-0 mb-4 bg-light">
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h4 className="text-primary fw-bold mb-0">📊 BẢNG LƯƠNG </h4>
          <div className="d-flex gap-2 align-items-center">
            <Form.Select size="sm" style={{ width: '120px' }} value={filter.month} onChange={(e) => setFilter({...filter, month: e.target.value})}>
              {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>Tháng {i+1}</option>))}
            </Form.Select>
            <Form.Control type="number" size="sm" style={{ width: '90px' }} value={filter.year} onChange={(e) => setFilter({...filter, year: e.target.value})} />
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : histories.length > 0 ? (
        histories.map((item, index) => {
          // LOGIC TÍNH TỔNG NGÀY GIỐNG MANAGER:
          // 1. Nếu Backend đã tính sẵn (DTO có trường totalDays) thì dùng luôn
          // 2. Nếu không, hiển thị giá trị từ item.totalDays (đã được Backend xử lý đếm Distinct)
          const displayDays = item.totalDays || 0;

          const grossSalary = item.totalAmount + (item.penaltyViolation || 0) + (item.penaltyAbsent || 0);

          return (
            <Card key={index} className="shadow-sm border-0 mb-4 overflow-hidden border-top border-primary border-5">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <h5 className="fw-bold mb-1 text-uppercase text-dark">Bảng kê Tháng {item.month} / {item.year}</h5>
                    <small className="text-muted">Quyết toán: {new Date(item.calculatedAt).toLocaleDateString('vi-VN')}</small>
                  </div>
                  <Badge bg="success">Đã quyết toán</Badge>
                </div>

                <Row className="text-center g-3 mb-4">
                  <Col xs={6} md={3}>
                    <div className="p-3 bg-white border rounded shadow-sm">
                      <small className="text-muted d-block mb-1">Tổng ngày làm</small>
                      {/* HIỂN THỊ SỐ NGÀY Ở ĐÂY */}
                      <h4 className="fw-bold mb-0 text-primary">{displayDays} ngày</h4>
                    </div>
                  </Col>
                  <Col xs={6} md={3}>
                    <div className="p-3 bg-white border rounded shadow-sm">
                      <small className="text-muted d-block mb-1">Tổng giờ làm</small>
                      <h4 className="fw-bold mb-0 text-primary">{item.totalHours}h</h4>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div className="p-3 bg-warning-subtle border border-warning rounded shadow-sm text-md-start px-4">
                      <small className="text-warning-emphasis fw-bold d-block mb-1">THU NHẬP CHƯA TRỪ PHẠT</small>
                      <h3 className="fw-bold mb-0 text-dark">{grossSalary.toLocaleString()}đ</h3>
                    </div>
                  </Col>
                </Row>

                <h6 className="fw-bold text-danger mb-2">Khấu trừ:</h6>
                <Table responsive bordered className="text-center mb-4">
                  <thead className="table-danger text-danger">
                    <tr>
                      <th>Phạt vi phạm</th>
                      <th>Phạt nghỉ không phép</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="fw-bold">
                      <td className="text-danger">-{item.penaltyViolation?.toLocaleString()}đ</td>
                      <td className="text-danger">-{item.penaltyAbsent?.toLocaleString()}đ</td>
                    </tr>
                  </tbody>
                </Table>

                <div className="p-4 bg-success text-white rounded-3 shadow d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-uppercase">Thực nhận:</h5>
                  <h2 className="mb-0 fw-bold">{item.totalAmount?.toLocaleString()}đ</h2>
                </div>
              </Card.Body>
            </Card>
          );
        })
      ) : (
        <Alert variant="info" className="text-center py-5">Chưa có dữ liệu cho Tháng {filter.month}/{filter.year}</Alert>
      )}
    </Container>
  );
}

export default MySalary;