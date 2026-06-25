import http from 'k6/http';
import { sleep, check } from 'k6';

// Cấu hình kịch bản stress test
export const options = {
  stages: [
    { duration: '30s', target: 1500 }, // Ramp-up to 1500 virtual users in 30s
    { duration: '2m', target: 3000 },  // Stay at 3000 virtual users for 2 mins
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
};

export default function () {
  // Gọi API query MongoDB để tạo tải thật (Gateway -> Jobs Service -> MongoDB)
  const res = http.get('http://jobbridge-jobbridge-gateway:8080/api/jobs'); 
  
  // Hoặc nếu bạn chỉ muốn test tĩnh Gateway:
  // const res = http.get('http://jobbridge-jobbridge-gateway:8080/health'); 

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Đã bỏ sleep(1) để chạy tối đa công suất của mỗi User
}
