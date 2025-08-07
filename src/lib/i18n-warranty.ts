// i18n keys for warranty module
export const warrantyTranslations = {
  en: {
    warranty: {
      title: 'Warranty Claims',
      newClaim: 'New Warranty Claim',
      claimNumber: 'Claim Number',
      faultDescription: 'Fault Description',
      invoiceDate: 'Invoice Date',
      warrantyExpiry: 'Warranty Expiry',
      status: {
        draft: 'Draft',
        submitted: 'Submitted',
        tech_reviewed: 'Tech Reviewed',
        approved: 'Approved',
        resolved: 'Resolved',
        closed: 'Closed',
        rejected: 'Rejected',
        cancelled: 'Cancelled'
      },
      actions: {
        submit: 'Submit',
        inspect: 'Inspect',
        approve: 'Approve',
        reject: 'Reject',
        finalize: 'Finalize',
        createClaim: 'Create Warranty Claim'
      },
      form: {
        customer: 'Customer',
        salesOrder: 'Sales Order',
        addProduct: 'Add Product',
        product: 'Product',
        serialNumber: 'Serial Number',
        quantity: 'Quantity',
        warrantyType: 'Warranty Type',
        standard: 'Standard',
        extended: 'Extended'
      },
      messages: {
        success: 'Warranty claim created successfully',
        submitSuccess: 'Warranty claim submitted for review',
        error: 'Failed to process warranty claim'
      }
    }
  },
  zh: {
    warranty: {
      title: '保修索赔',
      newClaim: '新建保修索赔',
      claimNumber: '索赔编号',
      faultDescription: '故障描述',
      invoiceDate: '发票日期',
      warrantyExpiry: '保修到期',
      status: {
        draft: '草稿',
        submitted: '已提交',
        tech_reviewed: '技术审核',
        approved: '已批准',
        resolved: '已解决',
        closed: '已关闭',
        rejected: '已拒绝',
        cancelled: '已取消'
      },
      actions: {
        submit: '提交',
        inspect: '检测',
        approve: '批准',
        reject: '拒绝',
        finalize: '完成',
        createClaim: '创建保修索赔'
      },
      form: {
        customer: '客户',
        salesOrder: '销售订单',
        addProduct: '添加产品',
        product: '产品',
        serialNumber: '序列号',
        quantity: '数量',
        warrantyType: '保修类型',
        standard: '标准',
        extended: '延保'
      },
      messages: {
        success: '保修索赔创建成功',
        submitSuccess: '保修索赔已提交审核',
        error: '处理保修索赔失败'
      }
    }
  }
};