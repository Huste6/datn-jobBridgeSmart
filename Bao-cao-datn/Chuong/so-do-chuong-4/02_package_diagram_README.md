# 2) Thiet ke tong quan (UML Package Diagram)

## File can ve
- `package_diagram.png`

## Noi dung can co
- Cac tang ro rang: Frontend, Gateway, Services, Data, AI.
- The hien phu thuoc 1 chieu: tang tren phu thuoc tang duoi.
- Khong co vong lap phu thuoc giua cac goi.

## Goi y
- Dung UML package diagram, sap xep theo chieu tu tren xuong duoi.
- Moi goi ghi ro ten package.

## Prompt goi y de gen anh (copy vao chat gen anh)
"Ve UML package diagram cho he thong JobBridge AI theo bo cuc tang tu tren xuong duoi. Nen trang, vien den, chu ro. Co 5 package chinh dang hinh chu nhat co ten: Frontend, Gateway, Services, Data, AI. Dat Frontend tren cung, Gateway o giua tren, Services o giua duoi, Data o duoi, AI o ben phai cung cap dich vu cho Services. Ve mui ten phu thuoc 1 chieu: Frontend -> Gateway -> Services -> Data. Ve mui ten phu thuoc Services -> AI. Khong co vong lap. Ghi chu nho duoi hinh: 'UML Package Diagram - JobBridge AI'."

## Bo cuc de ve
- Hang 1: Frontend (tren cung, chinh giua)
- Hang 2: Gateway (chinh giua, duoi Frontend)
- Hang 3: Services (chinh giua, duoi Gateway)
- Hang 4: Data (chinh giua, duoi Services)
- AI dat ben phai hang 3 (cung hang Services) va mui ten tu Services -> AI

## Ten package con (neu can viet nho trong moi goi)
- Frontend: "React SPA"
- Gateway: "API Gateway"
- Services: "Auth, Jobs, AI"
- Data: "MongoDB"
- AI: "OpenAI API"
