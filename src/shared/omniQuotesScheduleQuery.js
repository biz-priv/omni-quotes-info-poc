async function fetchScheduleQuery(){
    const omniQuotesInfoScheduleQuery= `select 
    PK_OrderNo,FK_ServiceLevelId,FK_ControlCustomerNo,cntrl.custname,a.billno,billto.custname,billto.custcity,billto.fk_custstate,
    billto.custzip,
    shipper.shipno as shipper_nbr,
    shipper.shipname AS SHIPPER_NAME,
    shipper.shipaddress1 AS SHIPPER_ADDR_1,
    shipper.shipaddress2 AS SHIPPER_ADDR_2,
    shipper.shipcity AS SHIPPER_CITY,
    shipper.fk_shipstate AS SHIPPER_ST,
    shipper.fk_shipcountry AS SHIPPER_CNTRY,
    shipper.shipzip AS SHIPPER_ZIP,
    consignee.conname AS CONSIGNEE_NAME,
    consignee.conaddress1 AS CONSIGNEE_ADDR_1,
    consignee.conAddress2 AS CONSIGNEE_ADDR_2,
    consignee.concity AS CONSIGNEE_CITY,
    consignee.fk_constate AS CONSIGNEE_ST,
    consignee.fk_concountry AS CONSIGNEE_CNTRY,
    consignee.conzip AS CONSIGNEE_ZIP,
    orgairport AS ORIGIN_PORT_IATA,
    destairport AS DESTINATION_PORT_IATA,
    FK_OrderStatusId as  order_status,
    A.FK_Salesperson,
    B.WEIGHTLBS AS ACTUAL_WGHT_LBS,
    B.WEIGHTKGS AS ACTUAL_WGHT_KGS,
    case when B.WEIGHTLBS > B.DIMWEIGHTLBS  then b.WEIGHTLBS else B.DIMWEIGHTLBS   end AS CHRG_WGHT_LBS,
    case when B.WEIGHTKGS > B.DIMWEIGHTKGS then B.WEIGHTKGS else B.DIMWEIGHTKGS end AS CHRG_WGHT_KGS,
    charges."TOTAL CHARGES" AS TOT_CHARGES,
    charges."TOTAL COSTS" AS TOT_COSTS,
    fk_modeid,
    PIECES,
    userid,
    OrderDate,
    instr.note
    from dbo.tbl_shipmentheader a 
    left outer join dbo.tbl_Customers cntrl
    on a.FK_ControlCustomerNo = cntrl.pk_custno
    left outer join dbo.tbl_Customers billto
    on a.FK_ControlCustomerNo = billto.pk_custno
    left outer join dbo.tbl_Shipper shipper
    on a.PK_OrderNo = shipper.FK_ShipOrderNo
    left outer join dbo.tbl_Consignee consignee
    on a.PK_OrderNo = consignee.FK_ConOrderNo
    LEFT OUTER JOIN
    (SELECT
    FK_ORDERNO, SUM(PIECES) AS PIECES,SUM(WEIGHT)WEIGHTLBS,SUM(WEIGHTKILO)WEIGHTKGS,
    SUM(dimweight)AS DIMWEIGHTLBS,
    SUM(dimweightkilo)AS DIMWEIGHTKGS,
    SUM(CUBICFEET)AS CUBIC_FEET,
    SUM(CUBICMETERS) AS CUBIC_METERS
    FROM dbo.tbl_ShipmentDesc
    GROUP BY FK_ORDERNO 
    )B
    ON A.PK_OrderNo = B.FK_OrderNo
    LEFT OUTER JOIN
    (SELECT FK_ORDERNO,
    SUM(CASE WHEN CHARGES.APARCODE = 'C' THEN TOTAL ELSE 0 END) AS "TOTAL CHARGES",
    SUM(CASE WHEN CHARGES.APARCODE = 'V'
    THEN (case when charges.FINALIZEDTOTAL <= 0 then TOTAL else finalizedtotal end)  else 0 end )"TOTAL COSTS",
    SUM(CASE WHEN CHARGES.APARCODE = 'C' THEN TOTAL ELSE 0 END) -
    SUM(CASE WHEN CHARGES.APARCODE = 'V'
    THEN (case when charges.FINALIZEDTOTAL <= 0 then TOTAL else finalizedtotal end)  else 0 end )
    AS "PROFIT"
    FROM
    dbo.tbl_ShipmentAPAR CHARGES
    GROUP BY CHARGES.FK_ORDERNO
    )CHARGES
    ON A.PK_OrderNo = CHARGES.FK_OrderNo
    left outer join dbo.tbl_instructions instr
    on a.pk_orderno = instr.fk_orderno
    where shipquote = 'Q'
    and cast(orderdate as date) >= DATEADD(day, -30, GETDATE())`
    return omniQuotesInfoScheduleQuery
}


module.exports = { fetchScheduleQuery };