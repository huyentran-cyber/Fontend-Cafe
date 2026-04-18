import { useEffect, useState } from 'react';
import { OverlayTrigger, Popover, Container, Table, Card, Button, Spinner, Badge, Row, Col, Form, Pagination } from 'react-bootstrap';
import api from '../../api/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function PayrollReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  const now = new Date();
  const [filter, setFilter] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Salary/report?month=${filter.month}&year=${filter.year}`);
      setReports(Array.isArray(res.data) ? res.data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Lỗi tải báo cáo lương:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [filter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const exportToExcel = async () => {
    if (reports.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo Cáo Lương');

    worksheet.columns = [
        { header: 'Nhân viên', key: 'name', width: 25 },
        { header: 'Vị trí', key: 'pos', width: 15 },
        { header: 'Ngày công', key: 'days', width: 12 },
        { header: 'Số ca', key: 'shifts', width: 10 },
        { header: 'Tổng giờ (h)', key: 'hours', width: 15 },
        { header: 'Lương/Giờ', key: 'rate', width: 15 },
        { header: 'Lương gốc', key: 'gross', width: 18 }, // Dùng grossSalary từ Backend
        { header: 'Tổng phạt', key: 'penalty', width: 18 },
        { header: 'Thực nhận', key: 'total', width: 20 },
    ];

    reports.forEach(r => {
        worksheet.addRow({
            name: r.employeeName,
            pos: r.positionName || "Staff",
            days: r.totalDays,
            shifts: r.totalShifts,
            hours: r.totalHours,
            rate: r.hourlyRate,
            gross: r.grossSalary, // ✅ FIX: Lấy trực tiếp từ Backend
            penalty: r.totalPenalty,
            total: r.totalSalary
        });
    });

    // ... (Phần format header và cell của Excel giữ nguyên như cũ) ...
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.eachCell((cell) => {
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
              if ([6, 7, 8, 9].includes(cell.column)) cell.numFmt = '#,##0"đ"';
            });
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Bao_Cao_Luong_Thang_${filter.month}_${filter.year}.xlsx`);
  };

  const handleCalculate = async () => {
    if (!window.confirm(`Xác nhận tính lại lương cho tháng ${filter.month}/${filter.year}?`)) return;
    setCalculating(true);
    try {
      await api.post(`/Salary/calculate?month=${filter.month}&year=${filter.year}`);
      alert("Tính toán lương thành công!");
      loadPayroll();
    } catch (err) {
      alert("Lỗi khi tính toán lương!");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Container className="mt-4 pb-5">
      {/* Header & Filter giữ nguyên */}
      <div className="bg-light p-4 rounded shadow-sm mb-4 border">
        <Row className="align-items-center">
          <Col md={4}><h4 className="text-success fw-bold mb-0">💰 Báo Cáo Lương Tổng Hợp</h4></Col>
          <Col md={8}>
            <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
              <Form.Select size="sm" style={{ width: '120px' }} value={filter.month} onChange={(e) => setFilter({...filter, month: e.target.value})}>
                {[...Array(12)].map((_, i) => (<option key={i+1} value={i+1}>Tháng {i+1}</option>))}
              </Form.Select>
              <Form.Control type="number" size="sm" style={{ width: '100px' }} value={filter.year} onChange={(e) => setFilter({...filter, year: e.target.value})} />
              <Button variant="primary" size="sm" onClick={handleCalculate} disabled={calculating}>
                {calculating ? <Spinner size="sm" animation="border" /> : "🔄 Tính lương"}
              </Button>
              <Button variant="success" size="sm" onClick={exportToExcel}>📥 Xuất Excel</Button>
            </div>
          </Col>
        </Row>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
        ) : (
          <>
            <Table responsive hover className="align-middle mb-0 text-center border">
              <thead className="table-success text-dark">
                <tr>
                  <th className="text-start ps-4">Nhân viên</th>
                  <th>Vị trí</th>
                  <th>Tổng công làm</th>
                  <th>Tổng giờ</th>
                  <th>Lương/h</th>
                  <th className="text-primary">Tổng tiền</th>
                  <th>Vi phạm</th>
                  <th className="text-danger">Tổng phạt</th>
                  <th className="bg-primary text-white">Thực nhận (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((r, i) => (
                    <tr key={i}>
                      <td className="text-start ps-4 fw-bold text-dark">{r.employeeName}</td>
                      <td><Badge bg="secondary-subtle" text="dark" className="border px-2">{r.positionName || "Staff"}</Badge></td>
                      <td className="fw-bold align-middle">
                        <div className="d-flex flex-column align-items-center">
                          <span className="text-primary small">{r.totalDays} ngày</span>
                          <span className="text-success small">{r.totalShifts} ca</span>
                        </div>
                      </td>
                      <td className="text-muted fw-bold">{r.totalHours !== null ? `${r.totalHours} h` : "0 h"}</td>
                      <td>{r.hourlyRate?.toLocaleString()}đ</td>
                      
                      {/* ✅ FIX: Hiển thị Gross Salary từ Backend */}
                      <td className="fw-bold text-primary">{(r.grossSalary ?? 0).toLocaleString()}đ</td>
                      
                      <td>
                        {r.violations ? (
                         <Badge 
                          bg="danger-subtle" 
                          text="danger" 
                          className="border border-danger small text-wrap" 
                          style={{ maxWidth: '150px', lineHeight: '1.4' }} // Giới hạn chiều rộng và giãn dòng
                        >
                          {r.violations}
                        </Badge>
                        ) : <span className="text-muted">--</span>}
                      </td>
                      <td>
                        <OverlayTrigger trigger="click" placement="left" rootClose
                          overlay={
                            <Popover id={`popover-${r.employeeId}`} className="shadow border-danger">
                              <Popover.Header as="h3" className="bg-danger text-white py-2" style={{fontSize: '14px'}}>Chi tiết phạt</Popover.Header>
                              <Popover.Body className="p-2" style={{ minWidth: '200px' }}>
                                <div className="d-flex justify-content-between mb-1"><span>Vi phạm:</span><span className="text-danger fw-bold">-{Math.round(r.penaltyViolation || 0).toLocaleString()}đ</span></div>
                                <div className="d-flex justify-content-between mb-2"><span>Nghỉ không phép:</span><span className="text-danger fw-bold">-{Math.round(r.penaltyAbsent || 0).toLocaleString()}đ</span></div>
                                <div className="border-top pt-2 d-flex justify-content-between fw-bold text-primary"><span>TỔNG:</span><span>-{Math.round(r.totalPenalty || 0).toLocaleString()}đ</span></div>
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <span style={{ cursor: 'pointer' }}>
                            {r.totalPenalty > 0 ? (
                              <Badge bg="danger-subtle" text="danger" className="border border-danger px-2 py-1">-{Math.round(r.totalPenalty).toLocaleString()}đ</Badge>
                            ) : <span className="text-muted small">0đ</span>}
                          </span>
                        </OverlayTrigger>
                      </td>
                      {/* ✅ FIX: Hiển thị Total Salary từ Backend */}
                      <td className="fw-bold text-success fs-5 bg-light">{(r.totalSalary ?? 0).toLocaleString()}đ</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="py-5 text-muted italic">Chưa có dữ liệu lương.</td></tr>
                )}
              </tbody>
            </Table>
            {/* Pagination giữ nguyên */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center py-3 bg-light border-top">
                <Pagination size="sm" className="mb-0 shadow-sm">
                  <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                  {[...Array(totalPages)].map((_, i) => (
                    <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>{i+1}</Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>
    </Container>
  );
}

export default PayrollReport;