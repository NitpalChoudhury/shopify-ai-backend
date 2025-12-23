const pool = require("./db");

async function offer(product_id,user_id){

   const count = await pool.query(
     "SELECT COUNT(*) FROM views WHERE user_id=$1 AND product_id=$2",
     [user_id,product_id]
   );

   if(Number(count.rows[0].count) > 3){
      return {offer:true,discount:"10%"};
   }

   return {offer:false,discount:"0%"};
}

module.exports = offer;
