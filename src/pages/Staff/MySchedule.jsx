import { useEffect, useState } from 'react';
import { Table, Container, Badge, Card, Spinner, Row, Col, Form, Pagination } from 'react-bootstrap';
import api from '../../api/api';

function MySchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  // 1. State cho bộ lọc
  const now = new Date();
  const [filter, setFilter] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });

  // 2. STATE CHO PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mỗi trang 10 dòng

  const loadData = () => {
    if (userId) {
      setLoading(true);
      api.get(`/WorkSchedule/my-schedule/${userId}?month=${filter.month}&year=${filter.year}`)
        .then(res => {
          setSchedules(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
          setCurrentPage(1); // Reset về trang 1 khi lọc tháng/năm mới
        })
        .catch(err => {
          console.error("Lỗi tải lịch làm việc:", err);
          setLoading(false);
        });
    }
  };

  useEffect(() => { loadData(); }, [userId, filter]);

  // 3. LOGIC TÍNH TOÁN PHÂN TRANG
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = schedules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(schedules.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.startsWith("0001")) return null;
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr.substring(0, 5);
  };

  const renderAttendanceDetail = (status, type) => {
    if (!status || status === "Present") return null;
    const isLate = type === 'in' && status.toLowerCase().includes('late');
    const isEarly = type === 'out' && status.toLowerCase().includes('early');

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
            <h4 className="text-primary fw-bold mb-0">🗓️ Lịch Làm Việc & Chấm Công</h4>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
              <Form.Select 
                size="sm" 
                style={{ width: '130px' }}
                value={filter.month}
                onChange={(e) => setFilter({...filter, month: e.target.value})}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>Tháng {i+1}</option>
                ))}
              </Form.Select>
              
              <Form.Control 
                type="number" 
                size="sm" 
                style={{ width: '100px' }}
                value={filter.year}
                onChange={(e) => setFilter({...filter, year: e.target.value})}
              />
            </div>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <>
            <Table hover responsive className="align-middle mb-0 text-center border">
              <thead className="table-dark">
                <tr>
                  <th>Ngày Làm</th>
                  <th>Ca Làm</th>
                  <th>Khung Giờ</th>
                  <th style={{ width: '250px' }}>Chấm Công (Vào - Ra)</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(s => {
                    const checkIn = s.checkInTime || s.attendance?.checkIn;
                    const checkOut = s.checkOutTime || s.attendance?.checkOut;
                    const status = s.attendanceStatus || s.attendance?.status;

                    return (
                      <tr key={s.id}>
                        <td className="fw-bold">
                          {new Date(s.workDate).toLocaleDateString('vi-VN', { 
                              weekday: 'short', day: '2-digit', month: '2-digit' 
                          })}
                        </td>
                        <td>
                          <Badge bg="info" text="dark" className="px-2 shadow-sm">
                            {s.shiftName || s.shift?.name}
                          </Badge>
                        </td>
                        <td className="text-muted small">
                          {formatTime(s.startTime || s.shift?.startTime)} - {formatTime(s.endTime || s.shift?.endTime)}
                        </td>

                        <td>
                          {checkIn ? (
                            <div className="d-flex justify-content-center align-items-center gap-1 small">
                              <div className="d-flex align-items-center">
                                <span className="text-success fw-bold">{formatTime(checkIn)}</span>
                                {renderAttendanceDetail(status, 'in')}
                              </div>
                              <span className="text-muted mx-1">-</span>
                              <div className="d-flex align-items-center">
                                {checkOut ? (
                                  <>
                                    <span className="text-danger fw-bold">{formatTime(checkOut)}</span>
                                    {renderAttendanceDetail(status, 'out')}
                                  </>
                                ) : (
                                  <span className="text-muted italic" style={{ fontSize: '10px' }}>--:--</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">---</span>
                          )}
                        </td>

                        <td>
                          {s.status === 'Confirmed' ? (
                            <Badge bg="success-subtle" text="success" className="border border-success rounded-pill px-3">Đã duyệt</Badge>
                          ) : s.status === 'Rejected' ? (
                            <Badge bg="danger-subtle" text="danger" className="border border-danger rounded-pill px-3">Từ chối</Badge>
                          ) : (
                            <Badge bg="warning-subtle" text="dark" className="border border-warning rounded-pill px-3">Chờ duyệt</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-5 text-muted italic">
                      Không có dữ liệu trong tháng {filter.month}/{filter.year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* THANH PHÂN TRANG */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center py-3 bg-light border-top">
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item 
                      key={i + 1} 
                      active={i + 1 === currentPage}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next 
                    onClick={() => handlePageChange(currentPage + 1)} 
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

export default MySchedule;