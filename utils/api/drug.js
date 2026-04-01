/**
 * 药品浏览 API 模块
 */
import { get } from './request.js'

/**
 * 将 API 返回的药品字段映射为 ProductCardList 所需的 product 结构
 */
export function mapDrugToProduct(drug) {
	let stockStatus = 'IN_STOCK'
	if (drug.stockQuantity <= 0) stockStatus = 'OUT_OF_STOCK'
	else if (drug.stockQuantity < 10) stockStatus = 'LOW_STOCK'

	return {
		product_id: drug.id,
		drug_id: drug.drugId,
		product_name: drug.drugName,
		specification: drug.drugSpecification || '',
		unit_price: drug.price,
		image_url: '',
		indications: drug.drugDescription || '',
		is_prescription: drug.isPrescriptionDrug || false,
		stock_status: stockStatus,
		stock_quantity: drug.stockQuantity,
		action_type: drug.isPrescriptionDrug ? 'VIEW_DETAIL' : 'ADD_TO_CART',
		category: drug.drugCategory || '',
		manufacturer: drug.manufacturer || '',
		dosage_form: drug.drugDosageForm || '',
		batch_number: drug.batchNumber || '',
		expiry_date: drug.expiryDate || '',
		insurance_category: drug.insuranceCategory || '',
		warning_info: drug.warningInfo || '',
		drug_status: drug.drugStatus || ''
	}
}

/**
 * 分页浏览药品（仅非处方药+有库存）
 * @param {Object} params
 * @param {string} [params.drugName] - 模糊搜索药品名称
 * @param {string} [params.drugCategory] - 精确筛选分类
 * @param {number} [params.pageNum=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 */
export async function getDrugPage(params = {}) {
	try {
		const query = {}
		if (params.drugName) query.drugName = params.drugName
		if (params.drugCategory) query.drugCategory = params.drugCategory
		query.pageNum = params.pageNum || 1
		query.pageSize = params.pageSize || 10
		return await get('/api/app/drugs/page', query)
	} catch (e) {
		return { code: 500, msg: e.message, data: [], total: 0 }
	}
}

/**
 * 获取药品详情
 * @param {string} drugId - 药品 UUID 主键
 */
export async function getDrugDetail(drugId) {
	try {
		return await get('/api/app/drugs/detail', { drugId })
	} catch (e) {
		return { code: 500, msg: e.message, data: null }
	}
}
