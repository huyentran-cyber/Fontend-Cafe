import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Badge, Form, Pagination } from 'react-bootstrap';
import api from '../../api/api';

function AttendanceManager() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Attendance?date=${filterDate}`);
      setAttendances(Array.isArray(res.data) ? res.data : []);
      setCurrentPage(1); // Reset về trang 1 khi đổi ngày
    } catch (err) {
      console.error("Lỗi tải dữ liệu chấm công:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate]);

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = attendances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(attendances.length / itemsPerPage);

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.startsWith("0001")) return "--:--";
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr.substring(0, 5);
  };

  const renderStatusDetail = (status, type) => {
    if (!status || status === "Present") return null;
    const statusLower = status.toLowerCase();
    const isLate = type === 'in' && statusLower.includes('late');
    const isEarly = type === 'out' && statusLower.includes('early');

    if (isLate || isEarly) {
      const match = status.match(/\((.*?)\)/);
      const duration = match ? match[1].replace('m', 'p') : "";
      return (
        <span className={isLate ? "text-danger ms-1" : "text-warning ms-1"} style={{ fontSize: '10px' }}>
          ({isLate ? `Muộn ${duration}` : `Sớm ${duration}`})
        </span>
      );
    }
    return null;
  };

  return (
    <Container className="mt-4 pb-5">
      <div className="bg-light p-3 rounded shadow-sm mb-4 border">
        <Row className="align-items-center">
          <Col md={6}>
            <h4 className="text-primary fw-bold mb-0">📑 Quản lý Chấm công</h4>
          </Col>
          <Col md={6}>
            <Form.Group className="d-flex align-items-center justify-content-md-end">
              <Form.Label className="me-2 mb-0 fw-bold text-muted small">Chọn ngày:</Form.Label>
              <Form.Control 
                type="date" 
                size="sm" 
                className="rounded-pill border-primary shadow-sm"
                style={{ width: '180px' }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <>
            <Table hover responsive className="align-middle mb-0 text-center border-bottom">
              <thead className="table-dark">
                <tr>
                  <th className="text-start ps-4">Nhân viên</th>
                  <th>Vị trí</th>
                  <th>Ca làm việc</th>
                  <th>Chấm công (Vào - Ra)</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((a) => (
                    <tr key={a.id}>
                      <td className="text-start ps-4">
                        <div className="fw-bold text-dark">{a.employeeName || "Không rõ tên"}</div>
                      </td>
                      <td>
                        <Badge bg="secondary-subtle" text="dark" className="border">
                          {a.positionName || "Staff"}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="info-subtle" text="info" className="border border-info-subtle px-3">
                          {a.shiftName || "N/A"}
                        </Badge>
                        <div className="text-muted" style={{ fontSize: '10px' }}>
                          ({formatTime(a.startTime)} - {formatTime(a.endTime)})
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center align-items-center gap-1">
                          <div className="d-flex align-items-center">
                            <span className="text-success fw-bold">{formatTime(a.checkIn)}</span>
                            {renderStatusDetail(a.status, 'in')}
                          </div>
                          <span className="text-muted mx-1">|</span>
                          <div className="d-flex align-items-center">
                            <span className={a.checkOut ? "text-danger fw-bold" : "text-muted italic small"}>
                              {a.checkOut ? formatTime(a.checkOut) : "Chưa về"}
                            </span>
                            {renderStatusDetail(a.status, 'out')}
                          </div>
                        </div>
                      </td>
                      <td>
                        {a.checkIn && a.checkOut ? (
                          <Badge bg="success" className="rounded-pill px-3">Hoàn thành</Badge>
                        ) : (
                          <Badge bg="warning" text="dark" className="rounded-pill px-3">Đang làm</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-5 text-muted italic">
                      Không có dữ liệu chấm công cho ngày {new Date(filterDate).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* THANH PHÂN TRANG */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center py-3 bg-light">
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1} 
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item 
                      key={i + 1} 
                      active={i + 1 === currentPage} 
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages} 
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>
    </Container>
  );
}

export default AttendanceManager;