const sanityClient = require('@sanity/client')
const path= require('path')
const fs = require('fs')



module.exports = async (
  job,
  settings,
  {
    input,
    params,
    document, 
    fieldName, 
    fieldType,
    filename
  },
  type
) => {

  const client = sanityClient(params)

  var filePath = input || job.output

  if (!path.isAbsolute(filePath)) filePath = path.join(job.workpath, filePath)

  const asset = await client.assets.upload(fieldType,
                    fs.createReadStream(filePath),
                      {filename: filename
                        })
  
                await client.patch(document)
                  .set({
                    [fieldName]: {
                      _type: fieldType,
                      asset: {
                        _type: "reference",
                        _ref: asset._id
                      }
                    }
                  })
                  .commit()

}

