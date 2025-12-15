# 患者医疗数据查询 API 文档

## 概述

本文档描述了 Eye-Agent-Backend 系统中患者医疗数据查询相关的 API 接口，包括病历、处方和检查结果的查询功能。这些接口为患者端应用提供完整的医疗历史数据访问能力。

**控制器**: `AppBaseController`
**基础路径**: `/api/app/base`
**版本**: 1.0
**最后更新**: 2025-12-15

---

## 目录

1. [接口总览](#接口总览)
2. [获取病历列表](#1-获取病历列表)
3. [获取处方列表](#2-获取处方列表)
4. [获取检查结果列表](#3-获取检查结果列表)
5. [数据模型](#数据模型)
6. [常见问题](#常见问题)
7. [错误处理](#错误处理)

---

## 通用说明

### 认证机制

所有接口都需要进行身份认证，使用 Sa-Token 进行认证管理。

**认证方式**:
- 在请求头中携带 Token: `satoken: <your-token-value>`
- Token 有效期: 24小时 (86400秒)
- 活动超时: 12小时 (43200秒)

### 响应格式

所有接口返回统一的 `SaResult` 格式:

```json
{
  "code": 200,
  "msg": "success",
  "data": [ ... ]
}
```

**状态码说明**:
- `200`: 成功
- `401`: 未认证或认证失败
- `403`: 权限不足
- `500`: 服务器内部错误

---

## 接口总览

| 接口名称 | HTTP方法 | 路径 | 功能描述 |
|---------|---------|------|---------|
| 获取病历列表 | GET | `/api/app/base/medical-record-list` | 获取患者所有病历记录 |
| 获取处方列表 | GET | `/api/app/base/prescription-list` | 获取患者所有处方记录 |
| 获取检查结果列表 | GET | `/api/app/base/check-result-list` | 获取患者所有检查结果 |

---

## 1. 获取病历列表

### 接口信息

**接口**: `GET /api/app/base/medical-record-list`

**描述**: 获取当前登录患者的所有病历记录列表，包含完整的病历信息以及关联的医院和医生信息。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

### 请求示例

```bash
curl -X GET http://localhost:8081/api/app/base/medical-record-list \
  -H "satoken: your-token-value"
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "mr001",
      "patientId": "patient123",
      "visitCardNumber": "VC20251214001",
      "reportId": "report001",
      "busId": "bus001",
      "fileId": "file001",
      "visitDate": "2025-12-14T00:00:00",
      "visitTime": "2025-12-14T09:30:00",
      "department": "眼科",
      "chiefComplaint": "视力模糊",
      "presentIllness": "近1月视力逐渐下降，看远处物体不清楚",
      "medicalHistory": "无特殊疾病史",
      "allergyHistory": "无药物过敏史",
      "familyHistory": "父亲有高度近视",
      "medicationHistory": "无长期用药史",
      "physicalExamination": "双眼外观正常，眼球运动正常",
      "eyeExamResults": "右眼视力0.6，左眼视力0.5",
      "specialExams": "眼底检查：视网膜未见异常",
      "auxiliaryExams": "验光检查已完成",
      "diagnosis": "双眼近视",
      "aiDiagnosis": "根据检查结果，诊断为轻度近视，建议配镜矫正",
      "treatmentPlan": "配镜矫正，定期复查",
      "medication": "无需用药",
      "surgicalHistory": "无",
      "hospitalizationInfo": "无",
      "followUpDate": "2026-06-14T00:00:00",
      "physicianName": "张医生",
      "doctorSignature": "张医生",
      "printTime": "2025-12-14T10:00:00",
      "hospitalName": "北京人民医院",
      "doctorName": "张医生",
      "createTime": "2025-12-14T09:30:00",
      "updateTime": "2025-12-14T10:00:00"
    }
  ]
}
```

### 响应数据结构

返回值为 `AppMedicalRecordResp` 数组，每个对象包含以下字段分类：

#### 病历基本信息 (6个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 病历ID |
| patientId | String | 患者ID |
| visitCardNumber | String | 就诊卡号 |
| reportId | String | 报告ID |
| busId | String | 业务ID |
| fileId | String | 文件ID |

#### 就诊信息 (3个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| visitDate | LocalDateTime | 就诊日期 |
| visitTime | LocalDateTime | 就诊时间 |
| department | String | 科室 |

#### 病史信息 (6个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| chiefComplaint | String | 主诉 |
| presentIllness | String | 现病史 |
| medicalHistory | String | 既往史 |
| allergyHistory | String | 过敏史 |
| familyHistory | String | 家族史 |
| medicationHistory | String | 用药史 |

#### 检查信息 (4个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| physicalExamination | String | 体格检查 |
| eyeExamResults | String | 眼部检查结果 |
| specialExams | String | 特殊检查 |
| auxiliaryExams | String | 辅助检查 |

#### 诊断与治疗 (4个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| diagnosis | String | 诊断 |
| aiDiagnosis | String | AI诊断 |
| treatmentPlan | String | 治疗方案 |
| medication | String | 用药 |

#### 其他信息 (5个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| surgicalHistory | String | 手术史 |
| hospitalizationInfo | String | 住院信息 |
| followUpDate | LocalDateTime | 复诊日期 |
| physicianName | String | 医生姓名 |
| doctorSignature | String | 医生签名 |
| printTime | LocalDateTime | 打印时间 |

#### 扩展字段 (2个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| hospitalName | String | 医院名称 |
| doctorName | String | 医生姓名 |

#### 系统字段 (2个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

### 使用场景

- 患者查看个人就医历史
- 查询特定疾病的诊疗记录
- 医生端查看患者病史
- 导出病历数据用于转诊

---

## 2. 获取处方列表

### 接口信息

**接口**: `GET /api/app/base/prescription-list`

**描述**: 获取当前登录患者的所有处方记录，包含处方基本信息和详细的药品清单。每个处方包含完整的药品信息、用法用量和费用明细。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

### 请求示例

```bash
curl -X GET http://localhost:8081/api/app/base/prescription-list \
  -H "satoken: your-token-value"
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "prescription": {
        "id": "presc001",
        "patientId": "patient123",
        "doctorId": "doctor123",
        "medicalRecordId": "mr001",
        "fileId": "file002",
        "prescriptionNumber": "RP20251214001",
        "prescriptionDate": "2025-12-14T10:30:00",
        "prescriptionType": "普通处方",
        "diagnosisDescription": "双眼近视",
        "usageInstruction": "按医嘱用药",
        "prescriptionStatus": "已配药",
        "totalAmount": 156.50,
        "notes": "饭后服用",
        "prescriberName": "张医生",
        "prescriberSignature": "张医生",
        "pharmacistName": "李药师",
        "pharmacistSignature": "李药师",
        "dispensedDate": "2025-12-14T11:00:00",
        "createTime": "2025-12-14T10:30:00",
        "updateTime": "2025-12-14T11:00:00"
      },
      "details": [
        {
          "id": "detail001",
          "prescriptionId": "presc001",
          "drugId": "drug001",
          "drugName": "维生素A软胶囊",
          "drugSpecification": "0.3g*30粒",
          "quantity": 2,
          "unit": "盒",
          "dosage": "2粒",
          "frequency": "每日3次",
          "duration": "30天",
          "administrationRoute": "口服",
          "unitPrice": 45.00,
          "subtotal": 90.00,
          "specialInstructions": "饭后服用，避免空腹",
          "createTime": "2025-12-14T10:30:00",
          "updateTime": "2025-12-14T10:30:00"
        },
        {
          "id": "detail002",
          "prescriptionId": "presc001",
          "drugId": "drug002",
          "drugName": "叶黄素胶囊",
          "drugSpecification": "10mg*60粒",
          "quantity": 1,
          "unit": "盒",
          "dosage": "1粒",
          "frequency": "每日2次",
          "duration": "30天",
          "administrationRoute": "口服",
          "unitPrice": 66.50,
          "subtotal": 66.50,
          "specialInstructions": "随餐服用",
          "createTime": "2025-12-14T10:30:00",
          "updateTime": "2025-12-14T10:30:00"
        }
      ]
    }
  ]
}
```

### 响应数据结构

返回值为 `PrescriptionWithDetail` 数组，每个对象包含2个主要部分：

#### 处方基本信息 (prescription 对象)

**处方标识信息 (7个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 处方ID |
| patientId | String | 患者ID |
| doctorId | String | 医生ID |
| medicalRecordId | String | 病历ID |
| fileId | String | 文件ID |
| prescriptionNumber | String | 处方编号 |
| prescriptionDate | LocalDateTime | 处方日期 |

**处方详情 (6个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| prescriptionType | String | 处方类型 |
| diagnosisDescription | String | 诊断描述 |
| usageInstruction | String | 用药指导 |
| prescriptionStatus | String | 处方状态 |
| totalAmount | BigDecimal | 总金额 |
| notes | String | 备注 |

**医师信息 (5个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| prescriberName | String | 开处方医生姓名 |
| prescriberSignature | String | 开处方医生签名 |
| pharmacistName | String | 药师姓名 |
| pharmacistSignature | String | 药师签名 |
| dispensedDate | LocalDateTime | 配药日期 |

**系统字段 (2个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

#### 处方明细列表 (details 数组)

每个药品明细对象包含以下字段：

**药品基本信息 (5个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 明细ID |
| prescriptionId | String | 处方ID |
| drugId | String | 药品编号 |
| drugName | String | 药品名称 |
| drugSpecification | String | 药品规格 |

**用量信息 (5个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| quantity | Integer | 数量 |
| unit | String | 单位 |
| dosage | String | 用量 |
| frequency | String | 频次 |
| duration | String | 疗程 |

**用法与费用 (4个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| administrationRoute | String | 给药途径 |
| unitPrice | BigDecimal | 单价 |
| subtotal | BigDecimal | 小计 |
| specialInstructions | String | 特殊说明 |

**系统字段 (2个字段)**
| 字段名 | 类型 | 说明 |
|--------|------|------|
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

### 字段说明

**处方状态** (`prescriptionStatus`):
- 待配药
- 已配药
- 已取药
- 已作废

**给药途径** (`administrationRoute`):
- 口服
- 外用
- 注射
- 滴眼
- 其他

### 使用场景

- 患者查看历史用药记录
- 医生开具新处方时参考既往用药
- 患者用药提醒功能
- 医保报销凭证查询

---

## 3. 获取检查结果列表

### 接口信息

**接口**: `GET /api/app/base/check-result-list`

**描述**: 获取当前登录患者的所有眼科检查结果，包含视力检查、验光数据、风险评估以及AI诊断等完整信息。支持近视度数预测和患病风险评估。

**权限**: 需要登录 (`@SaCheckLogin`)

**请求参数**: 无

### 请求示例

```bash
curl -X GET http://localhost:8081/api/app/base/check-result-list \
  -H "satoken: your-token-value"
```

### 响应示例

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "check001",
      "medicalRecordId": "mr001",
      "patientId": "patient123",
      "doctorId": "doctor123",
      "reportFileId": "file003",
      "reportNumber": "CR20251214001",
      "vaOd": 0.6,
      "vaOs": 0.5,
      "sphOd": -2.50,
      "cylOd": -0.75,
      "axisOd": 180,
      "odMyopiaPredictions": [-2.75, -3.00, -3.25, -3.50, -3.75],
      "sphOs": -2.25,
      "cylOs": -0.50,
      "axisOs": 175,
      "osMyopiaPredictions": [-2.50, -2.75, -3.00, -3.25, -3.50],
      "myopiaRisk": 75.5,
      "fundusDiseaseRisk": 12.3,
      "resultContent": "双眼低度近视伴散光",
      "funduscopy": "视网膜未见异常，视盘边界清晰",
      "department": "眼科",
      "doctorName": "张医生",
      "aiDiagnosis": "根据检查结果，诊断为轻度近视，建议配镜矫正。预测未来5次检查近视度数将逐步增加，建议加强用眼卫生，定期复查。",
      "createTime": "2025-12-14T09:45:00",
      "updateTime": "2025-12-14T10:15:00"
    }
  ]
}
```

### 响应数据结构

返回值为 `GetCheckHistoryResponse` 数组，每个对象包含以下字段分类：

#### 检查基本信息 (6个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 检查结果ID |
| medicalRecordId | String | 病历ID |
| patientId | String | 患者ID |
| doctorId | String | 医生ID |
| reportFileId | String | 报告文件ID |
| reportNumber | String | 报告编号 |

#### 右眼检查数据 (5个字段)
| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| vaOd | BigDecimal | 右眼视力 (OD: Oculus Dexter) | 0.6 |
| sphOd | BigDecimal | 右眼球镜度数 (Sphere) | -2.50 (负数=近视) |
| cylOd | BigDecimal | 右眼柱镜度数 (Cylinder) | -0.75 (散光度数) |
| axisOd | Integer | 右眼轴位 (Axis, 0-180度) | 180 |
| odMyopiaPredictions | List\<BigDecimal\> | 右眼未来5次近视度数预测 | [-2.75, -3.00, ...] |

#### 左眼检查数据 (5个字段)
| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| vaOs | BigDecimal | 左眼视力 (OS: Oculus Sinister) | 0.5 |
| sphOs | BigDecimal | 左眼球镜度数 (Sphere) | -2.25 |
| cylOs | BigDecimal | 左眼柱镜度数 (Cylinder) | -0.50 |
| axisOs | Integer | 左眼轴位 (Axis, 0-180度) | 175 |
| osMyopiaPredictions | List\<BigDecimal\> | 左眼未来5次近视度数预测 | [-2.50, -2.75, ...] |

#### 风险评估与诊断 (4个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| myopiaRisk | BigDecimal | 近视患病概率 (0-100) |
| fundusDiseaseRisk | BigDecimal | 眼底患病概率 (0-100) |
| resultContent | String | 检查结果内容 |
| funduscopy | String | 眼底检查 |

#### 扩展字段 (3个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| department | String | 科室 |
| doctorName | String | 医生姓名 |
| aiDiagnosis | String | AI诊断 |

#### 系统字段 (2个字段)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| createTime | LocalDateTime | 创建时间 |
| updateTime | LocalDateTime | 更新时间 |

### 医学术语说明

#### 视力表示
- 采用标准视力表示法，如 0.6, 1.0, 1.5 等
- **OD** (Oculus Dexter): 右眼
- **OS** (Oculus Sinister): 左眼
- **OU** (Oculus Uterque): 双眼

#### 验光数据
- **Sphere (球镜)**:
  - 负数表示近视（如 -2.50）
  - 正数表示远视（如 +1.50）
  - 单位：屈光度 (D)

- **Cylinder (柱镜)**:
  - 散光度数
  - 通常为负数
  - 单位：屈光度 (D)

- **Axis (轴位)**:
  - 散光轴向
  - 范围：0-180度
  - 表示散光方向

#### 近视度数分类
| 度数范围 | 分类 |
|---------|------|
| -0.25D 至 -3.00D | 轻度近视 |
| -3.25D 至 -6.00D | 中度近视 |
| -6.25D 及以上 | 高度近视 |

#### 近视预测
- `odMyopiaPredictions` 和 `osMyopiaPredictions` 数组包含5个预测值
- 每个值表示未来一次检查时预测的近视度数
- 基于AI算法预测，仅供参考

#### 风险评估
- 值范围：0-100，表示患病概率百分比
- **近视风险** (`myopiaRisk`):
  - 0-30: 低风险
  - 31-60: 中风险
  - 61-100: 高风险

- **眼底病风险** (`fundusDiseaseRisk`):
  - 0-20: 低风险
  - 21-50: 中风险
  - 51-100: 高风险

### 使用场景

- 患者查看历史检查记录
- 跟踪视力变化趋势
- 近视度数预测分析
- 医生诊疗参考依据
- 健康风险评估

---

## 数据模型

### 实体模型

#### MedicalRecord 实体

患者病历管理实体，包含24个业务字段 + 3个系统字段:

```java
public class MedicalRecord extends BaseModel {
    private String patientId;              // 患者ID
    private String visitCardNumber;        // 就诊卡号
    private String reportId;               // 报告ID
    private String busId;                  // 业务ID
    private String fileId;                 // 文件ID
    private LocalDateTime visitDate;       // 就诊日期
    private LocalDateTime visitTime;       // 就诊时间
    private String department;             // 科室
    private String chiefComplaint;         // 主诉
    private String presentIllness;         // 现病史
    private String medicalHistory;         // 既往史
    private String allergyHistory;         // 过敏史
    private String familyHistory;          // 家族史
    private String medicationHistory;      // 用药史
    private String physicalExamination;    // 体格检查
    private String eyeExamResults;         // 眼部检查结果
    private String specialExams;           // 特殊检查
    private String auxiliaryExams;         // 辅助检查
    private String diagnosis;              // 诊断
    private String aiDiagnosis;            // AI诊断
    private String treatmentPlan;          // 治疗方案
    private String medication;             // 用药
    private String surgicalHistory;        // 手术史
    private String hospitalizationInfo;    // 住院信息
    private LocalDateTime followUpDate;    // 复诊日期
    private String physicianName;          // 医生姓名
    private String doctorSignature;        // 医生签名
    private LocalDateTime printTime;       // 打印时间
}
```

#### Prescription 实体

处方管理实体，包含17个业务字段 + 3个系统字段:

```java
public class Prescription extends BaseModel {
    private String patientId;              // 患者ID
    private String doctorId;               // 医生ID
    private String medicalRecordId;        // 病历ID
    private String fileId;                 // 文件ID
    private String prescriptionNumber;     // 处方编号
    private LocalDateTime prescriptionDate;// 处方日期
    private String prescriptionType;       // 处方类型
    private String diagnosisDescription;   // 诊断描述
    private String usageInstruction;       // 用药指导
    private String prescriptionStatus;     // 处方状态
    private BigDecimal totalAmount;        // 总金额
    private String notes;                  // 备注
    private String prescriberName;         // 开处方医生姓名
    private String prescriberSignature;    // 开处方医生签名
    private String pharmacistName;         // 药师姓名
    private String pharmacistSignature;    // 药师签名
    private LocalDateTime dispensedDate;   // 配药日期
}
```

#### PrescriptionDetail 实体

处方明细实体，包含14个业务字段 + 3个系统字段:

```java
public class PrescriptionDetail extends BaseModel {
    private String prescriptionId;         // 处方ID
    private String drugId;                 // 药品编号
    private String drugName;               // 药品名称
    private String drugSpecification;      // 药品规格
    private Integer quantity;              // 数量
    private String unit;                   // 单位
    private String dosage;                 // 用量
    private String frequency;              // 频次
    private String duration;               // 疗程
    private String administrationRoute;    // 给药途径
    private BigDecimal unitPrice;          // 单价
    private BigDecimal subtotal;           // 小计
    private String specialInstructions;    // 特殊说明
}
```

#### CheckResult 实体

检查结果实体，包含18个业务字段 + 3个系统字段:

```java
public class CheckResult extends BaseModel {
    private String medicalRecordId;           // 病历ID
    private String patientId;                 // 患者ID
    private String doctorId;                  // 医生ID
    private String reportFileId;              // 报告文件ID
    private String reportNumber;              // 报告编号
    private BigDecimal vaOd;                  // 右眼视力
    private BigDecimal vaOs;                  // 左眼视力
    private BigDecimal sphOd;                 // 右眼球镜度数
    private BigDecimal cylOd;                 // 右眼柱镜度数
    private Integer axisOd;                   // 右眼轴位
    private List<BigDecimal> odMyopiaPredictions; // 右眼近视预测
    private BigDecimal sphOs;                 // 左眼球镜度数
    private BigDecimal cylOs;                 // 左眼柱镜度数
    private Integer axisOs;                   // 左眼轴位
    private List<BigDecimal> osMyopiaPredictions; // 左眼近视预测
    private BigDecimal myopiaRisk;            // 近视患病概率
    private BigDecimal fundusDiseaseRisk;     // 眼底患病概率
    private String resultContent;             // 检查结果内容
    private String funduscopy;                // 眼底检查
}
```

### DTO 模型

#### AppMedicalRecordResp

病历响应DTO，继承 MedicalRecord 并扩展2个字段:

```java
public class AppMedicalRecordResp extends MedicalRecord {
    private String hospitalName;  // 医院名称
    private String doctorName;    // 医生姓名
}
```

#### PrescriptionWithDetail

处方及明细响应DTO:

```java
public class PrescriptionWithDetail {
    private Prescription prescription;           // 处方基本信息
    private List<PrescriptionDetail> details;    // 处方明细列表
}
```

#### GetCheckHistoryResponse

检查历史响应DTO，继承 CheckResult 并扩展3个字段:

```java
public class GetCheckHistoryResponse extends CheckResult {
    private String department;    // 科室
    private String doctorName;    // 医生姓名
    private String aiDiagnosis;   // AI诊断
}
```

### BaseModel 说明

所有实体都继承自 BaseModel，包含以下系统字段:

```java
public class BaseModel {
    private String id;              // 主键ID
    private LocalDateTime createTime;  // 创建时间
    private LocalDateTime updateTime;  // 更新时间
    private Integer deleted;        // 逻辑删除标记（不返回给前端）
}
```

---

## 常见问题

### Q1: 如何获取特定时间范围的病历？

A: 当前接口返回所有病历，前端可以根据 `visitDate` 字段进行过滤。如需服务端分页或时间筛选，可联系后端开发团队扩展接口参数。

### Q2: 处方的总金额是如何计算的？

A: `totalAmount` 是所有药品明细的 `subtotal` 总和。每个药品的 `subtotal = unitPrice × quantity`。

### Q3: 近视预测的准确度如何？

A: 近视预测基于AI算法和历史数据，准确度约为70-85%，仅供参考。实际度数变化受多种因素影响，建议定期复查。

### Q4: 风险评估值如何解读？

A:
- 0-30: 低风险，建议正常体检
- 31-60: 中风险，建议增加检查频率
- 61-100: 高风险，建议尽快就医

### Q5: 为什么有些字段为 null？

A: 部分字段为可选字段，在某些情况下可能不会填写，例如：
- 初诊患者可能没有 `medicalHistory`
- 未配药的处方 `dispensedDate` 为 null
- 部分检查可能没有 `aiDiagnosis`

### Q6: 接口返回数据的排序规则？

A:
- **病历列表**: 按 `visitDate` 降序（最新的在前）
- **处方列表**: 按 `prescriptionDate` 降序
- **检查结果列表**: 按 `createTime` 降序

### Q7: 如何关联病历、处方和检查结果？

A: 通过 `medicalRecordId` 字段关联：
```
MedicalRecord (id)
    ├── Prescription (medicalRecordId)
    └── CheckResult (medicalRecordId)
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 成功 | - |
| 401 | 未认证或Token失效 | 重新登录获取新Token |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 资源不存在 | 检查请求的资源ID |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应格式

```json
{
  "code": 401,
  "msg": "未登录或登录已过期",
  "data": null
}
```

### 认证错误处理

当Token失效时：

```json
{
  "code": 401,
  "msg": "未登录或登录已过期",
  "data": null
}
```

**处理建议**:
1. 清除本地Token
2. 跳转到登录页面
3. 提示用户重新登录

### 空数据处理

当患者没有相关记录时，返回空数组而不是 null:

```json
{
  "code": 200,
  "msg": "success",
  "data": []
}
```

---

## 最佳实践

### 1. 数据缓存

建议在客户端缓存医疗数据以提升用户体验：

```javascript
// 缓存策略示例
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

async function getMedicalRecords() {
  const cached = localStorage.getItem('medicalRecords');
  const cacheTime = localStorage.getItem('medicalRecordsTime');

  if (cached && Date.now() - cacheTime < CACHE_DURATION) {
    return JSON.parse(cached);
  }

  const response = await fetch('/api/app/base/medical-record-list');
  const data = await response.json();

  localStorage.setItem('medicalRecords', JSON.stringify(data));
  localStorage.setItem('medicalRecordsTime', Date.now());

  return data;
}
```

### 2. 时间格式处理

所有时间字段使用 ISO 8601 格式 (`yyyy-MM-ddTHH:mm:ss`)，建议统一处理：

```javascript
// 格式化时间显示
function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN');
}

// 使用示例
const visitTime = formatDateTime(record.visitTime);
// 输出: "2025-12-14 09:30:00"
```

### 3. 错误处理

统一的错误处理函数：

```javascript
async function fetchMedicalData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'satoken': localStorage.getItem('token')
      }
    });

    const result = await response.json();

    if (result.code !== 200) {
      if (result.code === 401) {
        // 跳转登录
        window.location.href = '/login';
      } else {
        // 显示错误信息
        alert(result.msg);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('请求失败:', error);
    alert('网络错误，请稍后重试');
    return null;
  }
}
```

### 4. 数据展示优化

处理可能为 null 的字段：

```javascript
// 安全地显示字段
function displayField(value, defaultText = '未填写') {
  return value || defaultText;
}

// 使用示例
<div>
  <label>过敏史:</label>
  <span>{displayField(record.allergyHistory, '无')}</span>
</div>
```

### 5. 近视预测数据可视化

```javascript
// 绘制近视预测趋势图
function renderMyopiaTrend(predictions) {
  const labels = predictions.map((_, i) => `第${i+1}次`);

  // 使用 Chart.js 或其他图表库
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '预测近视度数',
        data: predictions,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      scales: {
        y: {
          reverse: true,  // 负数在上方
          title: {
            display: true,
            text: '近视度数 (D)'
          }
        }
      }
    }
  });
}
```

---

## 完整示例

### JavaScript/TypeScript 示例

```typescript
// 定义接口类型
interface MedicalRecord {
  id: string;
  patientId: string;
  visitDate: string;
  diagnosis: string;
  aiDiagnosis: string;
  // ... 其他字段
}

interface PrescriptionWithDetail {
  prescription: Prescription;
  details: PrescriptionDetail[];
}

interface CheckResult {
  id: string;
  vaOd: number;
  vaOs: number;
  sphOd: number;
  sphOs: number;
  aiDiagnosis: string;
  // ... 其他字段
}

// API 调用封装
class MedicalDataAPI {
  private baseURL = '/api/app/base';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'satoken': this.token
      }
    });

    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(result.msg);
    }

    return result.data;
  }

  // 获取病历列表
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>('/medical-record-list');
  }

  // 获取处方列表
  async getPrescriptions(): Promise<PrescriptionWithDetail[]> {
    return this.request<PrescriptionWithDetail[]>('/prescription-list');
  }

  // 获取检查结果列表
  async getCheckResults(): Promise<CheckResult[]> {
    return this.request<CheckResult[]>('/check-result-list');
  }
}

// 使用示例
async function loadPatientData() {
  const token = localStorage.getItem('satoken');
  const api = new MedicalDataAPI(token);

  try {
    // 并行加载所有数据
    const [records, prescriptions, checkResults] = await Promise.all([
      api.getMedicalRecords(),
      api.getPrescriptions(),
      api.getCheckResults()
    ]);

    console.log('病历数量:', records.length);
    console.log('处方数量:', prescriptions.length);
    console.log('检查结果数量:', checkResults.length);

    // 渲染数据到页面
    renderMedicalRecords(records);
    renderPrescriptions(prescriptions);
    renderCheckResults(checkResults);

  } catch (error) {
    console.error('加载数据失败:', error);
    alert('加载数据失败，请重试');
  }
}
```

### React 示例

```tsx
import React, { useEffect, useState } from 'react';

interface CheckResult {
  id: string;
  vaOd: number;
  vaOs: number;
  sphOd: number;
  sphOs: number;
  odMyopiaPredictions: number[];
  osMyopiaPredictions: number[];
  myopiaRisk: number;
  fundusDiseaseRisk: number;
  aiDiagnosis: string;
  createTime: string;
}

const CheckResultList: React.FC = () => {
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckResults();
  }, []);

  const fetchCheckResults = async () => {
    try {
      const response = await fetch('/api/app/base/check-result-list', {
        headers: {
          'satoken': localStorage.getItem('token') || ''
        }
      });

      const result = await response.json();

      if (result.code === 200) {
        setCheckResults(result.data);
      } else {
        alert(result.msg);
      }
    } catch (error) {
      console.error('获取检查结果失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="check-result-list">
      <h2>检查结果列表</h2>
      {checkResults.map(result => (
        <div key={result.id} className="check-result-item">
          <div className="result-header">
            <span className="date">
              {new Date(result.createTime).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div className="vision-data">
            <div className="eye-data">
              <h4>右眼 (OD)</h4>
              <p>视力: {result.vaOd}</p>
              <p>度数: {result.sphOd}D</p>
            </div>

            <div className="eye-data">
              <h4>左眼 (OS)</h4>
              <p>视力: {result.vaOs}</p>
              <p>度数: {result.sphOs}D</p>
            </div>
          </div>

          <div className="risk-assessment">
            <div className={`risk ${getRiskLevel(result.myopiaRisk)}`}>
              <label>近视风险:</label>
              <span>{result.myopiaRisk}%</span>
            </div>

            <div className={`risk ${getRiskLevel(result.fundusDiseaseRisk)}`}>
              <label>眼底病风险:</label>
              <span>{result.fundusDiseaseRisk}%</span>
            </div>
          </div>

          {result.aiDiagnosis && (
            <div className="ai-diagnosis">
              <h4>AI诊断建议</h4>
              <p>{result.aiDiagnosis}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function getRiskLevel(risk: number): string {
  if (risk <= 30) return 'low';
  if (risk <= 60) return 'medium';
  return 'high';
}

export default CheckResultList;
```

---

## 附录

### A. curl 命令示例

**获取病历列表**:
```bash
curl -X GET http://localhost:8081/api/app/base/medical-record-list \
  -H "satoken: your-token-value"
```

**获取处方列表**:
```bash
curl -X GET http://localhost:8081/api/app/base/prescription-list \
  -H "satoken: your-token-value"
```

**获取检查结果列表**:
```bash
curl -X GET http://localhost:8081/api/app/base/check-result-list \
  -H "satoken: your-token-value"
```

### B. Postman 导入

建议使用以下 Postman Collection 配置：

```json
{
  "info": {
    "name": "患者医疗数据查询API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "获取病历列表",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "satoken",
            "value": "{{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/medical-record-list",
          "host": ["{{baseUrl}}"],
          "path": ["medical-record-list"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8081/api/app/base"
    },
    {
      "key": "token",
      "value": "your-token-here"
    }
  ]
}
```

### C. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2025-12-15 | 初始版本，包含3个医疗数据查询接口 |

---

## 技术支持

如有问题或建议，请联系开发团队：

- **项目**: Eye-Agent-Backend
- **作者**: chengyiyang
- **技术栈**: Spring Boot 3.5.7 + Java 21 + Sa-Token
- **文档维护**: 开发团队

---

**文档结束**
