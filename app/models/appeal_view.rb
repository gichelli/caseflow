class AppealView < ApplicationRecord
  belongs_to :appeal, polymorphic: true
  belongs_to :user
end
