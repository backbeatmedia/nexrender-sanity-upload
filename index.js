const sanityClient = require('@sanity/client')
const path = require('path')
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

  // make a Sanity client
  const client = sanityClient(params)

  // find where the asset to be uploaded is stored
  var filePath = input || job.output
  if (!path.isAbsolute(filePath)) filePath = path.join(job.workpath, filePath)

  // discover any existing asset stored in the field
  const fields = `{${fieldName}{asset->}}`;
  const existing = await client.fetch(`*[_id == \"${document}\"] ${fields}`, {});

  // upload the new asset
  const uploaded = await client.assets.upload(fieldType,
    fs.createReadStream(filePath),
    {
      filename: filename
    })

  // patch the new asset into the field
  await client.patch(document)
    .set({
      [fieldName]: {
        _type: fieldType,
        asset: {
          _type: "reference",
          _ref: uploaded._id
        }
      }
    })
    .commit()

  // if there was already an asset in that field - delete it
  if (existing[fieldName]) {

    await client.delete(existing[fieldName]._id)

  }

}

