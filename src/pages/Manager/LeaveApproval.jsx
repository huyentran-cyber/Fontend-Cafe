import { useEffect, useState } from 'react';
import { Table, Button, Container, Badge, Card, Spinner, Pagination } from 'react-bootstrap';
import api from '../../api/api';

function LeaveApproval() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- THÊM STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/LeaveRequest/pending');
      setLeaveRequests(Array.isArray(res.data) ? res.data : []);
      setCurrentPage(1); // Reset về trang 1 khi tải lại dữ liệu
    } catch (err) {
      console.error("Lỗi tải đơn xin nghỉ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaveRequests.length / itemsPerPage);

  const handleStatus = async (id, statusValue) => {
    const actionName = statusValue === 1 ? 'duyệt' : 'từ chối';
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionName} đơn này?`)) {
      try {
        await api.put(`/LeaveRequest/review/${id}?status=${statusValue}`);
        alert(`Đã ${actionName} đơn nghỉ thành công.`);
        fetchRequests(); 
      } catch (err) {
        alert("Lỗi xử lý đơn: " + (err.response?.data || "Vui lòng thử lại"));
      }
    }
  };

  const renderStatus = (status) => {
    if (status === 0 || status === "Pending") return <Badge bg="warning" text="dark">Chờ duyệt</Badge>;
    if (status === 1 || status === "Approved") return <Badge bg="success">Đã duyệt</Badge>;
    if (status === 2 || status === "Rejected") return <Badge bg="danger">Từ chối</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  return (
    <Container className="mt-4 pb-5">
      <div className="bg-light p-3 rounded shadow-sm mb-4 border">
        <h4 className="text-danger fw-bold mb-0">📋 Duyệt Đơn Xin Nghỉ Phép</h4>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
        ) : (
          <>
            <Table responsive hover className="align-middle mb-0 text-center">
              <thead className="table-dark">
                <tr>
                  <th>Nhân viên</th>
                  <th>Ngày nghỉ</th>
                  <th>Lý do</th>
                  <th>Loại đơn</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(req => (
                    <tr key={req.id}>
                      <td className="fw-bold">{req.employeeName || `NV-${req.employeeId}`}</td>
                      <td>{new Date(req.offDate).toLocaleDateString('vi-VN')}</td>
                      <td className="text-start small">{req.reason}</td>
                      <td>
                        {req.isEmergency ? 
                          <Badge bg="danger">Đột xuất</Badge> : 
                          <Badge bg="secondary">Bình thường</Badge>
                        }
                      </td>
                      <td>{renderStatus(req.status)}</td>
                      <td>
                        {(req.status === 0 || req.status === "Pending") && (
                          <div className="d-flex justify-content-center gap-2">
                            <Button 
                              variant="success" 
                              size="sm" 
                              className="rounded-pill px-3"
                              onClick={() => handleStatus(req.id, 1)}
                            >
                              Duyệt
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              className="rounded-pill px-3"
                              onClick={() => handleStatus(req.id, 2)}
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-5 text-muted italic">Hiện không có đơn nào đang chờ duyệt.</td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/* --- THANH PHÂN TRANG --- */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center py-3 bg-light border-top">
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

export default LeaveApproval;